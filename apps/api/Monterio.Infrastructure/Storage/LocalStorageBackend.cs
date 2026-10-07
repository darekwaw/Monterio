using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace Monterio.Infrastructure.Storage;

/// <summary>Dysk serwera API — domyślny dostawca, bez konfiguracji w UI (ścieżka z appsettings:
/// Storage:Local:UploadPath). Format ścieżki (`guid_nazwa` względem UploadPath) bez zmian, żeby
/// załączniki sprzed wprowadzenia wyboru dostawcy nadal się czytały.</summary>
public class LocalStorageBackend : IStorageBackend
{
    public string UploadPath { get; }

    public LocalStorageBackend(IConfiguration config)
    {
        UploadPath = config["Storage:Local:UploadPath"] ?? "uploads";
        Directory.CreateDirectory(UploadPath);
    }

    public string Provider => StorageProviders.Local;
    public string Label => "Dysk serwera";
    public string Description => "Pliki na dysku serwera, na którym działa API (domyślnie, bez konfiguracji).";
    public bool IsCloud => false;
    public IReadOnlyList<StorageFieldDto> Fields => [];

    public async Task<string> SaveAsync(IReadOnlyDictionary<string, string> cfg, string fileName, string contentType,
        byte[] content, CancellationToken ct)
    {
        var safeName = $"{Guid.NewGuid():N}_{StorageBackendHelpers.SafeFileName(fileName)}";
        await File.WriteAllBytesAsync(Path.Combine(UploadPath, safeName), content, ct);
        return safeName;
    }

    public Task<byte[]> ReadAsync(IReadOnlyDictionary<string, string> cfg, string path, CancellationToken ct)
        => File.ReadAllBytesAsync(Path.Combine(UploadPath, path), ct);

    public Task DeleteAsync(IReadOnlyDictionary<string, string> cfg, string path, CancellationToken ct)
    {
        var full = Path.Combine(UploadPath, path);
        if (File.Exists(full)) File.Delete(full);
        return Task.CompletedTask;
    }
}
