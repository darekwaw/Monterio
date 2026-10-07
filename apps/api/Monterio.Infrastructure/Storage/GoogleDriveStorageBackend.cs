using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Drive.v3;
using Google.Apis.Http;
using Google.Apis.Services;
using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using GoogleFile = Google.Apis.Drive.v3.Data.File;

namespace Monterio.Infrastructure.Storage;

/// <summary>Google Drive. Dwa tryby logowania — wystarczy wypełnić jeden:
/// (a) konto serwisowe (JSON) — dla Google Workspace, najlepiej z Dyskiem współdzielonym
/// (konta serwisowe nie mają własnego miejsca na zwykłym Moim dysku);
/// (b) OAuth użytkownika (Client ID + Secret + Refresh Token) — działa też z kontem gmail.com.
/// Refresh token nie wygasa, więc nie ma ręcznego odnawiania dostępu.</summary>
public class GoogleDriveStorageBackend : IStorageBackend
{
    public string Provider => StorageProviders.GoogleDrive;
    public string Label => "Google Drive";
    public string Description => "Folder na Dysku Google (Workspace lub konto prywatne).";
    public bool IsCloud => true;

    public IReadOnlyList<StorageFieldDto> Fields { get; } =
    [
        new("FolderId", "ID folderu", Help: "Fragment adresu folderu po /folders/ (w przeglądarce Dysku Google)."),
        new("ServiceAccountJson", "Konto serwisowe (JSON)", Type: "textarea", Secret: true, Required: false,
            Help: "Zawartość pliku klucza JSON konta serwisowego. Folder (lub Dysk współdzielony) musi być udostępniony na adres e-mail konta serwisowego z uprawnieniem edytora. Alternatywa dla trzech pól poniżej."),
        new("ClientId", "OAuth Client ID", Required: false),
        new("ClientSecret", "OAuth Client Secret", Type: "password", Secret: true, Required: false),
        new("RefreshToken", "OAuth Refresh Token", Type: "password", Secret: true, Required: false,
            Help: "Token odświeżania uzyskany raz dla konta, na którego Dysku mają trafiać pliki (zakres https://www.googleapis.com/auth/drive), np. przez OAuth 2.0 Playground."),
    ];

    public string? Validate(IReadOnlyDictionary<string, string> cfg)
        => cfg.Get("ServiceAccountJson").Length > 0
           || (cfg.Get("ClientId").Length > 0 && cfg.Get("ClientSecret").Length > 0 && cfg.Get("RefreshToken").Length > 0)
            ? null
            : "Podaj konto serwisowe (JSON) albo komplet: Client ID, Client Secret i Refresh Token.";

    public async Task<string> SaveAsync(IReadOnlyDictionary<string, string> cfg, string fileName, string contentType,
        byte[] content, CancellationToken ct)
    {
        using var service = BuildService(cfg);
        var meta = new GoogleFile { Name = StorageBackendHelpers.SafeFileName(fileName), Parents = [cfg.Get("FolderId")] };
        using var stream = new MemoryStream(content);
        var request = service.Files.Create(meta, stream, string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType);
        request.Fields = "id";
        request.SupportsAllDrives = true;
        var progress = await request.UploadAsync(ct);
        if (progress.Exception is not null)
            throw new InvalidOperationException($"Google Drive: {progress.Exception.Message}");
        return request.ResponseBody.Id;
    }

    public async Task<byte[]> ReadAsync(IReadOnlyDictionary<string, string> cfg, string path, CancellationToken ct)
    {
        using var service = BuildService(cfg);
        var request = service.Files.Get(path);
        request.SupportsAllDrives = true;
        using var ms = new MemoryStream();
        await request.DownloadAsync(ms, ct);
        return ms.ToArray();
    }

    public async Task DeleteAsync(IReadOnlyDictionary<string, string> cfg, string path, CancellationToken ct)
    {
        using var service = BuildService(cfg);
        var request = service.Files.Delete(path);
        request.SupportsAllDrives = true;
        await request.ExecuteAsync(ct);
    }

    private static DriveService BuildService(IReadOnlyDictionary<string, string> cfg)
    {
        IConfigurableHttpClientInitializer credential;
        var serviceAccountJson = cfg.Get("ServiceAccountJson");
        if (!string.IsNullOrEmpty(serviceAccountJson))
        {
            credential = CredentialFactory.FromJson<ServiceAccountCredential>(serviceAccountJson)
                .ToGoogleCredential().CreateScoped(DriveService.Scope.Drive);
        }
        else
        {
            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets { ClientId = cfg.Get("ClientId"), ClientSecret = cfg.Get("ClientSecret") },
                Scopes = [DriveService.Scope.Drive],
            });
            credential = new UserCredential(flow, "monterio", new TokenResponse { RefreshToken = cfg.Get("RefreshToken") });
        }

        return new DriveService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "Monterio",
        });
    }
}
