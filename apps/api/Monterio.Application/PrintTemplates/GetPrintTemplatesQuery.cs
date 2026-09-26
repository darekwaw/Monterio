using Monterio.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.PrintTemplates;

public record GetPrintTemplatesQuery : IRequest<List<PrintTemplateDto>>;

public record PrintTemplateDto(int Id, string Name, string TemplateHtml, bool IsDefault, bool IsActive);

public class GetPrintTemplatesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetPrintTemplatesQuery, List<PrintTemplateDto>>
{
    public async Task<List<PrintTemplateDto>> Handle(GetPrintTemplatesQuery request, CancellationToken ct)
    {
        var templates = await db.PrintTemplates.OrderBy(t => t.Name).ToListAsync(ct);
        return templates.Select(t => new PrintTemplateDto(t.Id, t.Name, t.TemplateHtml, t.IsDefault, t.IsActive)).ToList();
    }
}
