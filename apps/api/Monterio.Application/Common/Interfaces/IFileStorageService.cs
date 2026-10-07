namespace Monterio.Application.Common.Interfaces;

/// <summary>Gdzie wylądował plik: dostawca (Local/OneDrive/...) + klucz/ścieżka u tego dostawcy.</summary>
public record StoredFile(string Provider, string Path);

public interface IFileStorageService
{
    /// <summary>Zapisuje plik u aktualnie aktywnego dostawcy (domyślnie dysk lokalny).</summary>
    Task<StoredFile> SaveAsync(string fileName, string contentType, byte[] content, CancellationToken ct);

    /// <summary>Czyta plik od dostawcy, u którego został zapisany (nie od aktywnego — ten mógł się zmienić).</summary>
    Task<byte[]> ReadAsync(string provider, string storagePath, CancellationToken ct);
}

public record StorageFieldDto(
    string Key, string Label, string Type = "text", bool Secret = false, bool Required = true,
    string? Placeholder = null, string? Help = null);

public record StorageProviderDto(
    string Provider, string Label, string Description, bool IsCloud,
    IReadOnlyList<StorageFieldDto> Fields,
    IReadOnlyDictionary<string, string> Values,
    IReadOnlyList<string> SecretsSet,
    bool Configured);

public record StorageSettingsDto(string ActiveProvider, IReadOnlyList<StorageProviderDto> Providers);

public record StorageTestResult(bool Success, string? Error);

/// <summary>Konfiguracja dostawców przechowywania (UI "Przechowywanie plików"). Sekrety nigdy nie
/// wracają do klienta — pole puste przy zapisie oznacza "zostaw dotychczasową wartość".</summary>
public interface IStorageAdminService
{
    Task<StorageSettingsDto> GetSettingsAsync(CancellationToken ct);

    /// <summary>Waliduje, testuje połączenie (zapis+odczyt pliku próbnego) i dopiero wtedy aktywuje dostawcę.</summary>
    Task SaveAndActivateAsync(string provider, IReadOnlyDictionary<string, string?> values, CancellationToken ct);

    Task<StorageTestResult> TestAsync(string provider, IReadOnlyDictionary<string, string?> values, CancellationToken ct);
}
