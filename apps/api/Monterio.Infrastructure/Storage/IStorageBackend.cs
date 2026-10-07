using Monterio.Application.Common.Interfaces;

namespace Monterio.Infrastructure.Storage;

/// <summary>Jeden dostawca przechowywania plików. Bezstanowy — konfiguracja (z odszyfrowanymi
/// sekretami) przychodzi z każdym wywołaniem, bo zależy od ustawień zapisanych w bazie.</summary>
public interface IStorageBackend
{
    string Provider { get; }
    string Label { get; }
    string Description { get; }
    bool IsCloud { get; }
    IReadOnlyList<StorageFieldDto> Fields { get; }

    /// <summary>Zapisuje plik i zwraca ścieżkę/klucz potrzebny do późniejszego odczytu.</summary>
    Task<string> SaveAsync(IReadOnlyDictionary<string, string> cfg, string fileName, string contentType,
        byte[] content, CancellationToken ct);

    Task<byte[]> ReadAsync(IReadOnlyDictionary<string, string> cfg, string path, CancellationToken ct);

    /// <summary>Dodatkowa walidacja zależności między polami (zwraca komunikat błędu albo null).</summary>
    string? Validate(IReadOnlyDictionary<string, string> cfg) => null;

    /// <summary>Używane tylko do sprzątania pliku próbnego po teście połączenia.</summary>
    Task DeleteAsync(IReadOnlyDictionary<string, string> cfg, string path, CancellationToken ct);
}

internal static class StorageBackendHelpers
{
    public static string Get(this IReadOnlyDictionary<string, string> cfg, string key)
        => cfg.TryGetValue(key, out var v) ? v.Trim() : string.Empty;

    /// <summary>Nazwa pliku bezpieczna dla wszystkich dostawców (Windows/OneDrive/Dropbox/S3) —
    /// bez separatorów ścieżki i znaków zarezerwowanych.</summary>
    public static string SafeFileName(string fileName)
    {
        var name = Path.GetFileName(fileName);
        foreach (var c in "\"*:<>?/\\|".Concat(Path.GetInvalidFileNameChars()))
            name = name.Replace(c, '_');
        name = name.Trim().TrimEnd('.');
        return string.IsNullOrEmpty(name) ? "plik" : name;
    }

    /// <summary>Unikalny podkatalog na plik — dwa załączniki o tej samej nazwie nie nadpisują się.</summary>
    public static string UniqueKey(string fileName) => $"{Guid.NewGuid():N}/{SafeFileName(fileName)}";

    public static async Task<byte[]> ReadAllAsync(Stream stream, CancellationToken ct)
    {
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms, ct);
        return ms.ToArray();
    }
}
