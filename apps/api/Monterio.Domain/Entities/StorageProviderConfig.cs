using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>Nazwy dostawców przechowywania załączników. "Local" = dysk serwera API (domyślny, bez
/// konfiguracji, nie ma własnego rekordu <see cref="StorageProviderConfig"/>).</summary>
public static class StorageProviders
{
    public const string Local = "Local";
    public const string OneDrive = "OneDrive";
    public const string GoogleDrive = "GoogleDrive";
    public const string Dropbox = "Dropbox";
    public const string S3 = "S3";
}

/// <summary>Konfiguracja jednego dostawcy chmury (jeden rekord na dostawcę, najwyżej jeden aktywny).
/// Konfiguracja trzymana per dostawca, a nie jako jeden "bieżący" rekord — dzięki temu po zmianie
/// dostawcy wcześniej zapisane załączniki nadal da się odczytać (każdy załącznik pamięta swojego
/// dostawcę). Dane (z sekretami) są szyfrowane ASP.NET Data Protection.</summary>
public class StorageProviderConfig : BaseEntity
{
    public string Provider { get; private set; } = string.Empty;
    public string ConfigurationEncrypted { get; private set; } = string.Empty;
    public bool IsActive { get; private set; }

    private StorageProviderConfig() { }

    public static StorageProviderConfig Create(string provider, string configurationEncrypted, bool isActive)
        => new() { Provider = provider, ConfigurationEncrypted = configurationEncrypted, IsActive = isActive };

    public void Update(string configurationEncrypted)
    {
        ConfigurationEncrypted = configurationEncrypted;
        SetUpdatedAt();
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        SetUpdatedAt();
    }
}
