using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;

namespace Monterio.Infrastructure.Storage;

/// <summary>Wybiera dostawcę plików (zapis → aktywny, odczyt → ten, u którego plik leży) i zarządza
/// jego konfiguracją. Konfiguracja (z sekretami) jest szyfrowana Data Protection przed zapisem w bazie.</summary>
public class StorageService(
    IApplicationDbContext db,
    IDataProtectionProvider dataProtection,
    IEnumerable<IStorageBackend> backends,
    ILogger<StorageService> logger) : IFileStorageService, IStorageAdminService
{
    private static readonly IReadOnlyDictionary<string, string> Empty = new Dictionary<string, string>();
    private readonly IDataProtector _protector = dataProtection.CreateProtector("Monterio.Storage.v1");

    // ── IFileStorageService ─────────────────────────────────────────────────

    public async Task<StoredFile> SaveAsync(string fileName, string contentType, byte[] content, CancellationToken ct)
    {
        var active = await db.StorageProviderConfigs.FirstOrDefaultAsync(c => c.IsActive, ct);
        var provider = active?.Provider ?? StorageProviders.Local;
        var backend = GetBackend(provider);
        var cfg = active is null ? Empty : Decrypt(active);

        var path = await backend.SaveAsync(cfg, fileName, contentType, content, ct);
        return new StoredFile(provider, path);
    }

    public async Task<byte[]> ReadAsync(string provider, string storagePath, CancellationToken ct)
    {
        var backend = GetBackend(provider);
        if (provider == StorageProviders.Local)
            return await backend.ReadAsync(Empty, storagePath, ct);

        var row = await db.StorageProviderConfigs.FirstOrDefaultAsync(c => c.Provider == provider, ct)
            ?? throw new InvalidOperationException(
                $"Plik leży w {backend.Label}, ale konfiguracja tego dostawcy została usunięta.");
        return await backend.ReadAsync(Decrypt(row), storagePath, ct);
    }

    // ── IStorageAdminService ────────────────────────────────────────────────

    public async Task<StorageSettingsDto> GetSettingsAsync(CancellationToken ct)
    {
        var rows = await db.StorageProviderConfigs.ToListAsync(ct);
        var active = rows.FirstOrDefault(r => r.IsActive)?.Provider ?? StorageProviders.Local;

        var providers = backends.Select(b =>
        {
            var row = rows.FirstOrDefault(r => r.Provider == b.Provider);
            IReadOnlyDictionary<string, string> cfg = Empty;
            if (row is not null)
            {
                // Nie da się odszyfrować (np. zgubione klucze Data Protection) — pokaż jako nieskonfigurowane,
                // użytkownik wpisze dane od nowa, zamiast dostać błąd na całej stronie.
                try { cfg = Decrypt(row); }
                catch (InvalidOperationException ex) { logger.LogWarning(ex, "Konfiguracja {Provider} nieczytelna", b.Provider); }
            }

            var secretKeys = b.Fields.Where(f => f.Secret).Select(f => f.Key).ToHashSet();
            return new StorageProviderDto(
                b.Provider, b.Label, b.Description, b.IsCloud, b.Fields,
                Values: cfg.Where(kv => !secretKeys.Contains(kv.Key)).ToDictionary(kv => kv.Key, kv => kv.Value),
                SecretsSet: cfg.Where(kv => secretKeys.Contains(kv.Key) && !string.IsNullOrEmpty(kv.Value))
                    .Select(kv => kv.Key).ToList(),
                Configured: !b.IsCloud || cfg.Count > 0);
        }).ToList();

        return new StorageSettingsDto(active, providers);
    }

    public async Task SaveAndActivateAsync(string provider, IReadOnlyDictionary<string, string?> values, CancellationToken ct)
    {
        var backend = GetBackend(provider);
        var rows = await db.StorageProviderConfigs.ToListAsync(ct);

        if (!backend.IsCloud)
        {
            foreach (var r in rows) r.SetActive(false);
            await db.SaveChangesAsync(ct);
            return;
        }

        var row = rows.FirstOrDefault(r => r.Provider == provider);
        var merged = Merge(backend, row, values);

        var test = await RunTestAsync(backend, merged, ct);
        if (!test.Success)
            throw new InvalidOperationException($"Test połączenia nie powiódł się: {test.Error}");

        var encrypted = _protector.Protect(JsonSerializer.Serialize(merged));
        if (row is null)
        {
            row = StorageProviderConfig.Create(provider, encrypted, isActive: true);
            db.StorageProviderConfigs.Add(row);
        }
        else
        {
            row.Update(encrypted);
        }

        foreach (var r in rows.Where(r => r.Provider != provider)) r.SetActive(false);
        row.SetActive(true);
        await db.SaveChangesAsync(ct);
    }

    public async Task<StorageTestResult> TestAsync(string provider, IReadOnlyDictionary<string, string?> values, CancellationToken ct)
    {
        var backend = GetBackend(provider);
        if (!backend.IsCloud) return new StorageTestResult(true, null);

        var row = await db.StorageProviderConfigs.FirstOrDefaultAsync(c => c.Provider == provider, ct);
        Dictionary<string, string> merged;
        try { merged = Merge(backend, row, values); }
        catch (InvalidOperationException ex) { return new StorageTestResult(false, ex.Message); }

        return await RunTestAsync(backend, merged, ct);
    }

    // ── pomocnicze ──────────────────────────────────────────────────────────

    private IStorageBackend GetBackend(string provider)
        => backends.FirstOrDefault(b => b.Provider == provider)
           ?? throw new InvalidOperationException($"Nieznany dostawca przechowywania: {provider}.");

    private Dictionary<string, string> Decrypt(StorageProviderConfig row)
    {
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(_protector.Unprotect(row.ConfigurationEncrypted))
                   ?? [];
        }
        catch (Exception ex) when (ex is System.Security.Cryptography.CryptographicException or JsonException)
        {
            throw new InvalidOperationException(
                $"Nie można odczytać konfiguracji dostawcy {row.Provider} (zmieniły się klucze szyfrowania?). Zapisz ją ponownie.", ex);
        }
    }

    /// <summary>Składa konfigurację z przesłanych pól. Puste pole sekretu = zostaje dotychczasowa
    /// wartość (sekrety nie wracają do przeglądarki, więc formularz nie może ich odesłać).</summary>
    private Dictionary<string, string> Merge(IStorageBackend backend, StorageProviderConfig? existingRow,
        IReadOnlyDictionary<string, string?> values)
    {
        IReadOnlyDictionary<string, string> existing = Empty;
        if (existingRow is not null)
        {
            try { existing = Decrypt(existingRow); }
            catch (InvalidOperationException) { /* nieczytelne — wymagamy wpisania wszystkiego od nowa */ }
        }

        var merged = new Dictionary<string, string>();
        foreach (var f in backend.Fields)
        {
            var submitted = values.TryGetValue(f.Key, out var v) ? v?.Trim() : null;
            var value = string.IsNullOrEmpty(submitted) && f.Secret ? existing.Get(f.Key) : submitted ?? string.Empty;

            if (string.IsNullOrEmpty(value))
            {
                if (f.Required) throw new InvalidOperationException($"Pole „{f.Label}” jest wymagane.");
                continue;
            }
            merged[f.Key] = value;
        }

        var error = backend.Validate(merged);
        if (error is not null) throw new InvalidOperationException(error);
        return merged;
    }

    /// <summary>Test = zapis małego pliku, odczyt i porównanie, sprzątanie. Łapie błędne dane
    /// logowania, brak uprawnień i błędny folder/bucket zanim konfiguracja trafi na produkcję.</summary>
    private async Task<StorageTestResult> RunTestAsync(IStorageBackend backend, Dictionary<string, string> cfg, CancellationToken ct)
    {
        string? path = null;
        try
        {
            var payload = Encoding.UTF8.GetBytes($"Monterio test połączenia {DateTime.UtcNow:O}");
            path = await backend.SaveAsync(cfg, "monterio-test.txt", "text/plain", payload, ct);
            var read = await backend.ReadAsync(cfg, path, ct);
            if (!read.AsSpan().SequenceEqual(payload))
                return new StorageTestResult(false, "Odczytany plik próbny różni się od zapisanego.");
            return new StorageTestResult(true, null);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Test połączenia z {Provider} nieudany", backend.Provider);
            return new StorageTestResult(false, ex.Message);
        }
        finally
        {
            if (path is not null)
            {
                try { await backend.DeleteAsync(cfg, path, ct); }
                catch (Exception ex) { logger.LogDebug(ex, "Nie usunięto pliku próbnego {Path}", path); }
            }
        }
    }
}
