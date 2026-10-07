using Monterio.Application.Storage;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Monterio.API.Controllers;

/// <summary>Gdzie fizycznie trafiają załączniki: dysk serwera albo chmura (OneDrive, Google Drive,
/// Dropbox, S3/MinIO). Tylko dla dyspozytorów — instalator (mobile) nie ma wglądu w ustawienia.</summary>
[Tags("Przechowywanie plików")]
[ApiController]
[Route("api/storage")]
[Authorize(Roles = "Dispatcher")]
public class StorageController(ISender sender) : ControllerBase
{
    /// <summary>Aktywny dostawca + lista dostawców z opisem pól formularza. Sekrety nie są zwracane
    /// (tylko lista kluczy, które mają zapisaną wartość).</summary>
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
        => Ok(await sender.Send(new GetStorageSettingsQuery(), ct));

    /// <summary>Zapisuje konfigurację dostawcy i robi go aktywnym — po udanym teście połączenia.
    /// Dla "Local" tylko przełącza z powrotem na dysk serwera.</summary>
    [HttpPut]
    public async Task<IActionResult> Save([FromBody] StorageSettingsRequest body, CancellationToken ct)
    {
        await sender.Send(new SaveStorageSettingsCommand(body.Provider, body.Values ?? []), ct);
        return NoContent();
    }

    /// <summary>Sprawdza połączenie (zapis, odczyt i usunięcie pliku próbnego) bez zapisywania ustawień.</summary>
    [HttpPost("test")]
    public async Task<IActionResult> Test([FromBody] StorageSettingsRequest body, CancellationToken ct)
        => Ok(await sender.Send(new TestStorageCommand(body.Provider, body.Values ?? []), ct));

    /// <summary>Przenosi załączniki z dysku serwera do aktywnej chmury (pliki lokalne zostają).</summary>
    [HttpPost("migrate")]
    public async Task<IActionResult> Migrate(CancellationToken ct)
        => Ok(await sender.Send(new MigrateLocalAttachmentsCommand(), ct));
}

public record StorageSettingsRequest(string Provider, Dictionary<string, string?>? Values);
