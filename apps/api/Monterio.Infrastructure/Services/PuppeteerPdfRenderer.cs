using Monterio.Application.Common.Interfaces;
using PuppeteerSharp;
using PuppeteerSharp.Media;

namespace Monterio.Infrastructure.Services;

/// <summary>Renderuje HTML (szablon protokołu po podstawieniu tokenów) do PDF przez headless Chromium.
/// Świadomy wybór zamiast DevExpress (CMMS) — patrz komentarz na PrintTemplate.cs.
///
/// Jedna żywa przeglądarka na cały czas życia procesu (klasa jest singletonem w DI) — każdy PDF
/// dostaje tylko nową, lekką kartę (Page), a nie cały nowy proces Chromium. Bez tego setki
/// równoległych wydruków (setki dyspozytorów) odpalałyby setki procesów Chromium naraz.
/// Jeśli przeglądarka padnie (crash), IsConnected wykryje to i następne żądanie odpali ją ponownie.</summary>
public class PuppeteerPdfRenderer(Microsoft.Extensions.Configuration.IConfiguration config) : IPdfRenderer, IAsyncDisposable
{
    private readonly SemaphoreSlim _lock = new(1, 1);
    private bool _browserFetched;
    private IBrowser? _browser;

    public async Task<byte[]> RenderHtmlToPdfAsync(string html, CancellationToken ct)
    {
        var browser = await GetBrowserAsync(ct);

        await using var page = await browser.NewPageAsync();
        await page.SetContentAsync(html);
        return await page.PdfDataAsync(new PdfOptions
        {
            Format = PaperFormat.A4,
            PrintBackground = true,
            MarginOptions = new MarginOptions { Top = "15mm", Bottom = "15mm", Left = "12mm", Right = "12mm" },
        });
    }

    private async Task<IBrowser> GetBrowserAsync(CancellationToken ct)
    {
        if (_browser is { IsConnected: true }) return _browser;

        await _lock.WaitAsync(ct);
        try
        {
            if (_browser is { IsConnected: true }) return _browser;

            var chromePath = config["Pdf:ChromePath"];
            if (string.IsNullOrWhiteSpace(chromePath) && !_browserFetched)
            {
                await new BrowserFetcher().DownloadAsync();
                _browserFetched = true;
            }

            _browser = await Puppeteer.LaunchAsync(new LaunchOptions
            {
                Headless = true,
                ExecutablePath = string.IsNullOrWhiteSpace(chromePath) ? null : chromePath,
                Args = ["--no-sandbox"],
            });
            return _browser;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_browser is not null)
            await _browser.CloseAsync();
    }
}
