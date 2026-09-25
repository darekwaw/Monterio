using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>Dowolny szablon raportu/wydruku — HTML z tokenami podstawianymi przy generowaniu PDF.
/// Druga rzecz, która zrobiła klientowi "WOW" na demie. Świadomie tylko ścieżka HTML (Puppeteer) —
/// w CMMS równoległa ścieżka XML/DevExpress nigdy nie została dokończona (brak klucza NuGet).</summary>
public class PrintTemplate : BaseEntity, ISoftDelete
{
    public string Name { get; private set; } = string.Empty;
    public string TemplateHtml { get; private set; } = string.Empty;
    public bool IsDefault { get; private set; }
    public bool IsActive { get; private set; } = true;

    private PrintTemplate() { }

    public static PrintTemplate Create(string name, string templateHtml)
        => new() { Name = name, TemplateHtml = templateHtml };

    public void Update(string name, string templateHtml, bool isActive)
    {
        Name = name;
        TemplateHtml = templateHtml;
        IsActive = isActive;
        SetUpdatedAt();
    }

    public void SetDefault(bool isDefault) { IsDefault = isDefault; SetUpdatedAt(); }
}
