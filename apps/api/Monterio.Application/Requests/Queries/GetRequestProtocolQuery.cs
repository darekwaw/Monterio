using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using Monterio.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Requests.Queries;

public record GetRequestProtocolQuery(int RequestId) : IRequest<ProtocolFileResult?>;

public record ProtocolFileResult(string FileName, byte[] Content);

/// <summary>Buduje PDF protokołu ze zlecenia: szablon HTML (domyślny aktywny PrintTemplate) +
/// podstawienie tokenów {{token}} + render przez IPdfRenderer (Puppeteer). Brak szablonu ⇒ null,
/// kontroler zwraca 404 — świadomie bez "stub" fallbacku jak w CMMS, tylko jasny komunikat.</summary>
public partial class GetRequestProtocolQueryHandler(IApplicationDbContext db, IPdfRenderer pdfRenderer)
    : IRequestHandler<GetRequestProtocolQuery, ProtocolFileResult?>
{
    public async Task<ProtocolFileResult?> Handle(GetRequestProtocolQuery request, CancellationToken ct)
    {
        var r = await db.Requests
            .Include(x => x.Customer).ThenInclude(c => c.Address)
            .Include(x => x.Location)
            .Include(x => x.Address)
            .Include(x => x.ServiceGroup)
            .Include(x => x.Contractor)
            .Include(x => x.Employee)
            .Include(x => x.Activities).ThenInclude(a => a.Tasks).ThenInclude(t => t.MeasurementAttribute)
            .FirstOrDefaultAsync(x => x.Id == request.RequestId, ct);
        if (r is null) return null;

        var template = await db.PrintTemplates.FirstOrDefaultAsync(t => t.IsDefault && t.IsActive, ct);
        if (template is null) return null;

        var tokens = new Dictionary<string, string>
        {
            ["numer_zlecenia"] = WebUtility.HtmlEncode(r.Number),
            ["data_utworzenia"] = r.CreatedAt.ToString("dd.MM.yyyy"),
            ["data_wykonania"] = r.ScheduledDate?.ToString("dd.MM.yyyy") ?? "—",
            ["data_realizacji"] = r.CompletionDate?.ToString("dd.MM.yyyy") ?? "—",
            ["roznica_dni"] = FormatDayDifference(r.ScheduledDate, r.CompletionDate),
            ["klient_nazwa"] = WebUtility.HtmlEncode(r.Customer.Name),
            ["klient_telefon"] = WebUtility.HtmlEncode(r.Customer.Phone ?? "—"),
            ["klient_adres"] = WebUtility.HtmlEncode(FormatAddress(r.Customer.Address)),
            ["adres_wykonania"] = WebUtility.HtmlEncode(FormatAddress(r.Address ?? r.Customer.Address)),
            ["lokalizacja"] = WebUtility.HtmlEncode(r.Location?.Name ?? "—"),
            ["opis"] = WebUtility.HtmlEncode(r.Description ?? ""),
            ["grupa_serwisowa"] = WebUtility.HtmlEncode(r.ServiceGroup?.Name ?? "—"),
            ["firma_wykonawcza"] = WebUtility.HtmlEncode(r.Contractor?.Name ?? "—"),
            ["instalator"] = WebUtility.HtmlEncode(r.Employee?.FullName ?? "—"),
            ["tabela_uslug"] = BuildActivitiesTable(r.Activities),
        };

        var html = SubstituteTokens(template.TemplateHtml, tokens);
        var pdf = await pdfRenderer.RenderHtmlToPdfAsync(html, ct);
        return new ProtocolFileResult($"Protokol_{r.Number.Replace('/', '_')}.pdf", pdf);
    }

    /// <summary>Dodatnia liczba = opóźnienie (realizacja po terminie), ujemna = wcześniej.</summary>
    private static string FormatDayDifference(DateTime? scheduled, DateTime? completed)
    {
        if (scheduled is null || completed is null) return "—";
        var days = (completed.Value.Date - scheduled.Value.Date).Days;
        return days switch
        {
            0 => "na czas",
            > 0 => $"+{days} dni (opóźnienie)",
            _ => $"{days} dni (wcześniej)",
        };
    }

    private static string FormatAddress(Domain.Entities.Address? address)
    {
        if (address is null) return "—";
        var parts = new[] { address.Street, $"{address.PostalCode} {address.City}".Trim(), address.Country }
            .Where(p => !string.IsNullOrWhiteSpace(p));
        var joined = string.Join(", ", parts);
        return string.IsNullOrWhiteSpace(joined) ? "—" : joined;
    }

    private static string BuildActivitiesTable(IEnumerable<Domain.Entities.RequestActivity> activities)
    {
        var list = activities.ToList();
        var nameCounts = list.GroupBy(a => a.Name).ToDictionary(g => g.Key, g => g.Count());
        var seen = new Dictionary<string, int>();

        var sb = new StringBuilder();
        sb.Append("<table style=\"width:100%;border-collapse:collapse;font-size:13px;\">");
        sb.Append("<thead><tr>")
          .Append("<th style=\"text-align:left;border-bottom:1px solid #ccc;padding:4px 6px;\">Usługa / czynność</th>")
          .Append("<th style=\"text-align:left;border-bottom:1px solid #ccc;padding:4px 6px;\">Wynik</th>")
          .Append("</tr></thead><tbody>");

        foreach (var activity in list)
        {
            seen[activity.Name] = seen.GetValueOrDefault(activity.Name) + 1;
            var label = nameCounts[activity.Name] > 1 ? $"{activity.Name} #{seen[activity.Name]}" : activity.Name;

            sb.Append("<tr><td colspan=\"2\" style=\"padding:8px 6px 2px;font-weight:600;\">")
              .Append(WebUtility.HtmlEncode(label)).Append("</td></tr>");

            foreach (var task in activity.Tasks.OrderBy(t => t.SortOrder))
            {
                var result = task.MeasurementAttributeId != null
                    ? FormatMeasurement(task)
                    : task.IsDone ? "✓ wykonano" : "—";

                sb.Append("<tr><td style=\"padding:2px 6px 2px 18px;border-bottom:1px solid #eee;\">")
                  .Append(WebUtility.HtmlEncode(task.Description))
                  .Append("</td><td style=\"padding:2px 6px;border-bottom:1px solid #eee;\">")
                  .Append(WebUtility.HtmlEncode(result))
                  .Append("</td></tr>");
            }
        }

        sb.Append("</tbody></table>");
        return sb.ToString();
    }

    private static string FormatMeasurement(Domain.Entities.RequestActivityTask task) =>
        task.MeasurementAttribute?.DataType switch
        {
            Domain.Enums.AttributeDataType.Boolean => task.MeasuredValueBoolean switch
            {
                true => "Tak", false => "Nie", null => "—",
            },
            Domain.Enums.AttributeDataType.Date => task.MeasuredValueDate?.ToString("dd.MM.yyyy") ?? "—",
            Domain.Enums.AttributeDataType.Text or Domain.Enums.AttributeDataType.Select =>
                string.IsNullOrWhiteSpace(task.MeasuredValueText) ? "—" : task.MeasuredValueText,
            _ => task.MeasuredValueDecimal != null
                ? $"{task.MeasuredValueDecimal.Value.ToString("0.##")} {task.MeasurementAttribute?.Unit}".Trim()
                : "—",
        };

    private static string SubstituteTokens(string templateHtml, Dictionary<string, string> tokens)
        => TokenPattern().Replace(templateHtml, m =>
        {
            var key = m.Groups[1].Value.Trim().ToLowerInvariant();
            return tokens.TryGetValue(key, out var value) ? value : m.Value;
        });

    [GeneratedRegex(@"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")]
    private static partial Regex TokenPattern();
}
