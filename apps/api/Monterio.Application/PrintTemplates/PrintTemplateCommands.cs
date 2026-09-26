using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.PrintTemplates;

public record CreatePrintTemplateCommand(string Name, string TemplateHtml) : IRequest<int>;

public class CreatePrintTemplateCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreatePrintTemplateCommand, int>
{
    public async Task<int> Handle(CreatePrintTemplateCommand request, CancellationToken ct)
    {
        var template = PrintTemplate.Create(request.Name, request.TemplateHtml);
        await db.PrintTemplates.AddAsync(template, ct);
        await db.SaveChangesAsync(ct);

        // Pierwszy zdefiniowany szablon staje się domyślny automatycznie — inaczej druk protokołu
        // nie miałby czego użyć.
        var anyOther = await db.PrintTemplates.AnyAsync(t => t.Id != template.Id, ct);
        if (!anyOther)
        {
            template.SetDefault(true);
            await db.SaveChangesAsync(ct);
        }

        return template.Id;
    }
}

public record UpdatePrintTemplateCommand(int Id, string Name, string TemplateHtml, bool IsActive) : IRequest;

public class UpdatePrintTemplateCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdatePrintTemplateCommand>
{
    public async Task Handle(UpdatePrintTemplateCommand request, CancellationToken ct)
    {
        var template = await db.PrintTemplates.FirstOrDefaultAsync(t => t.Id == request.Id, ct)
            ?? throw new InvalidOperationException($"PrintTemplate {request.Id} not found.");
        template.Update(request.Name, request.TemplateHtml, request.IsActive);
        await db.SaveChangesAsync(ct);
    }
}

public record SetDefaultPrintTemplateCommand(int Id) : IRequest;

public class SetDefaultPrintTemplateCommandHandler(IApplicationDbContext db)
    : IRequestHandler<SetDefaultPrintTemplateCommand>
{
    public async Task Handle(SetDefaultPrintTemplateCommand request, CancellationToken ct)
    {
        var templates = await db.PrintTemplates.ToListAsync(ct);
        var target = templates.FirstOrDefault(t => t.Id == request.Id)
            ?? throw new InvalidOperationException($"PrintTemplate {request.Id} not found.");

        foreach (var t in templates)
            t.SetDefault(t.Id == request.Id);

        await db.SaveChangesAsync(ct);
    }
}
