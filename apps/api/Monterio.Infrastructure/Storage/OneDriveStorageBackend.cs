using System.Net.Http.Headers;
using System.Text.Json;
using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;

namespace Monterio.Infrastructure.Storage;

/// <summary>Microsoft OneDrive / SharePoint przez Graph API, uwierzytelnianie aplikacyjne (client
/// credentials) — bez logowania użytkownika i bez wygasających tokenów do ręcznego odnawiania.
/// Wymaga rejestracji aplikacji w Entra ID z uprawnieniem aplikacyjnym Files.ReadWrite.All.
/// Zamiast ciężkich SDK (Graph/MSAL) zwykły HttpClient — potrzebne są tylko 3 wywołania.</summary>
public class OneDriveStorageBackend : IStorageBackend
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromMinutes(5) };
    private const string GraphBase = "https://graph.microsoft.com/v1.0";

    public string Provider => StorageProviders.OneDrive;
    public string Label => "Microsoft OneDrive";
    public string Description => "Folder na OneDrive (konto firmowe Microsoft 365). Aplikacja loguje się własnym sekretem, nie hasłem użytkownika.";
    public bool IsCloud => true;

    public IReadOnlyList<StorageFieldDto> Fields { get; } =
    [
        new("TenantId", "Tenant ID", Placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            Help: "Entra ID → Przegląd → Identyfikator katalogu (dzierżawy)."),
        new("ClientId", "Client ID (aplikacja)"),
        new("ClientSecret", "Client Secret", Type: "password", Secret: true,
            Help: "Wpis tajny klienta zarejestrowanej aplikacji; aplikacja potrzebuje uprawnienia Files.ReadWrite.All (typ: aplikacyjne) z zgodą administratora."),
        new("DriveOwner", "Konto właściciela dysku", Placeholder: "serwis@firma.pl",
            Help: "Adres e-mail (UPN) użytkownika, na którego OneDrive trafią pliki."),
        new("Folder", "Folder", Required: false, Placeholder: "Monterio",
            Help: "Folder główny na pliki; zostanie utworzony automatycznie. Domyślnie „Monterio”."),
    ];

    public async Task<string> SaveAsync(IReadOnlyDictionary<string, string> cfg, string fileName, string contentType,
        byte[] content, CancellationToken ct)
    {
        var token = await GetTokenAsync(cfg, ct);
        var path = $"{FolderSegments(cfg)}/{StorageBackendHelpers.UniqueKey(fileName)}";
        var url = $"{DriveUrl(cfg)}/root:/{EscapePath(path)}:/content";

        using var req = new HttpRequestMessage(HttpMethod.Put, url) { Content = new ByteArrayContent(content) };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        req.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        using var resp = await Http.SendAsync(req, ct);
        await EnsureSuccessAsync(resp, "OneDrive", ct);

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        return doc.RootElement.GetProperty("id").GetString()!;
    }

    public async Task<byte[]> ReadAsync(IReadOnlyDictionary<string, string> cfg, string path, CancellationToken ct)
    {
        var token = await GetTokenAsync(cfg, ct);
        // Graph odpowiada 302 na pre-autoryzowany adres pobierania; HttpClient podąża za nim sam
        // (nagłówek Authorization nie jest wtedy przesyłany do innej domeny — tak ma być).
        using var req = new HttpRequestMessage(HttpMethod.Get, $"{DriveUrl(cfg)}/items/{Uri.EscapeDataString(path)}/content");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        using var resp = await Http.SendAsync(req, ct);
        await EnsureSuccessAsync(resp, "OneDrive", ct);
        return await resp.Content.ReadAsByteArrayAsync(ct);
    }

    public async Task DeleteAsync(IReadOnlyDictionary<string, string> cfg, string path, CancellationToken ct)
    {
        var token = await GetTokenAsync(cfg, ct);
        using var req = new HttpRequestMessage(HttpMethod.Delete, $"{DriveUrl(cfg)}/items/{Uri.EscapeDataString(path)}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        using var resp = await Http.SendAsync(req, ct);
        await EnsureSuccessAsync(resp, "OneDrive", ct);
    }

    private static string DriveUrl(IReadOnlyDictionary<string, string> cfg)
        => $"{GraphBase}/users/{Uri.EscapeDataString(cfg.Get("DriveOwner"))}/drive";

    private static string FolderSegments(IReadOnlyDictionary<string, string> cfg)
    {
        var folder = cfg.Get("Folder").Trim('/', '\\');
        return string.IsNullOrEmpty(folder) ? "Monterio" : folder.Replace('\\', '/');
    }

    private static string EscapePath(string path)
        => string.Join('/', path.Split('/').Select(Uri.EscapeDataString));

    private static async Task<string> GetTokenAsync(IReadOnlyDictionary<string, string> cfg, CancellationToken ct)
    {
        using var resp = await Http.PostAsync(
            $"https://login.microsoftonline.com/{Uri.EscapeDataString(cfg.Get("TenantId"))}/oauth2/v2.0/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = cfg.Get("ClientId"),
                ["client_secret"] = cfg.Get("ClientSecret"),
                ["scope"] = "https://graph.microsoft.com/.default",
                ["grant_type"] = "client_credentials",
            }), ct);
        await EnsureSuccessAsync(resp, "Logowanie do Microsoft", ct);

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        return doc.RootElement.GetProperty("access_token").GetString()!;
    }

    private static async Task EnsureSuccessAsync(HttpResponseMessage resp, string what, CancellationToken ct)
    {
        if (resp.IsSuccessStatusCode) return;
        var body = await resp.Content.ReadAsStringAsync(ct);
        string detail = body;
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("error_description", out var d)) detail = d.GetString() ?? body;
            else if (doc.RootElement.TryGetProperty("error", out var e) && e.TryGetProperty("message", out var m))
                detail = m.GetString() ?? body;
        }
        catch (JsonException) { /* odpowiedź nie jest JSON-em — zostaje surowa treść */ }
        throw new InvalidOperationException($"{what}: HTTP {(int)resp.StatusCode} — {Truncate(detail)}");
    }

    private static string Truncate(string s) => s.Length > 300 ? s[..300] + "…" : s;
}
