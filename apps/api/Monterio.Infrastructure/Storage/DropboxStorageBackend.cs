using Dropbox.Api;
using Dropbox.Api.Files;
using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;

namespace Monterio.Infrastructure.Storage;

/// <summary>Dropbox. Refresh token + App Key/Secret — SDK sam odnawia krótkożyjący access token,
/// więc konfiguracja działa bez dalszej ręcznej obsługi (w odróżnieniu od gołego access tokenu,
/// który w Dropboxie wygasa po kilku godzinach).</summary>
public class DropboxStorageBackend : IStorageBackend
{
    public string Provider => StorageProviders.Dropbox;
    public string Label => "Dropbox";
    public string Description => "Folder w Dropbox (aplikacja z uprawnieniami files.content.write/read).";
    public bool IsCloud => true;

    public IReadOnlyList<StorageFieldDto> Fields { get; } =
    [
        new("AppKey", "App Key", Help: "Z konsoli aplikacji Dropbox (dropbox.com/developers/apps)."),
        new("AppSecret", "App Secret", Type: "password", Secret: true),
        new("RefreshToken", "Refresh Token", Type: "password", Secret: true,
            Help: "Token uzyskany jednorazowo w trybie offline (token_access_type=offline) — nie wygasa."),
        new("Folder", "Folder", Required: false, Placeholder: "/Monterio",
            Help: "Folder główny na pliki; zostanie utworzony automatycznie. Domyślnie „/Monterio”."),
    ];

    public async Task<string> SaveAsync(IReadOnlyDictionary<string, string> cfg, string fileName, string contentType,
        byte[] content, CancellationToken ct)
    {
        using var client = BuildClient(cfg);
        var folder = cfg.Get("Folder").Trim().Trim('/');
        var path = $"/{(string.IsNullOrEmpty(folder) ? "Monterio" : folder)}/{StorageBackendHelpers.UniqueKey(fileName)}";
        using var stream = new MemoryStream(content);
        var metadata = await client.Files.UploadAsync(new UploadArg(path, mode: WriteMode.Add.Instance), stream);
        return metadata.PathLower;
    }

    public async Task<byte[]> ReadAsync(IReadOnlyDictionary<string, string> cfg, string path, CancellationToken ct)
    {
        using var client = BuildClient(cfg);
        using var response = await client.Files.DownloadAsync(path);
        return await response.GetContentAsByteArrayAsync();
    }

    public async Task DeleteAsync(IReadOnlyDictionary<string, string> cfg, string path, CancellationToken ct)
    {
        using var client = BuildClient(cfg);
        await client.Files.DeleteV2Async(path);
    }

    private static DropboxClient BuildClient(IReadOnlyDictionary<string, string> cfg)
        => new(cfg.Get("RefreshToken"), cfg.Get("AppKey"), cfg.Get("AppSecret"));
}
