using Monterio.Application.Common;
using Monterio.Application.Common.Dtos;
using Monterio.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Requests.Commands;

/// <summary>Dokładnie jeden poziom przypisania naraz: grupa, ALBO firma w grupie, ALBO konkretny
/// pracownik firmy. Pozostałe pola trzeba jawnie wyzerować (null), nie są domyślnie czyszczone.</summary>
public record AssignRequestCommand(int RequestId, int? ServiceGroupId, int? ContractorId, int? EmployeeId) : IRequest;

public class AssignRequestCommandHandler(IApplicationDbContext db, IRequestHubService hubService)
    : IRequestHandler<AssignRequestCommand>
{
    public async Task Handle(AssignRequestCommand request, CancellationToken ct)
    {
        var req = await db.Requests.FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new InvalidOperationException($"Request {request.RequestId} not found.");
        req.Assign(request.ServiceGroupId, request.ContractorId, request.EmployeeId);
        await db.SaveChangesAsync(ct);
        await hubService.NotifyRequestChanged(req.CompanyId, req.Id, ct);
    }
}

/// <summary>Instalator sam "przejmuje" zlecenie z puli (mobile) — bez konieczności, żeby
/// dyspozytor ręcznie przypisał konkretną osobę. Dozwolone tylko gdy zlecenie jeszcze nie ma
/// EmployeeId, ORAZ (jest już przypisane do jego firmy) ALBO (jest w puli grupy serwisowej, do
/// której jego firma należy) — patrz GetInstallerRequestsQuery, ta sama reguła widoczności.</summary>
public record ClaimRequestCommand(int RequestId, int EmployeeId, int ContractorId) : IRequest;

public class ClaimRequestCommandHandler(IApplicationDbContext db, IRequestHubService hubService)
    : IRequestHandler<ClaimRequestCommand>
{
    public async Task Handle(ClaimRequestCommand request, CancellationToken ct)
    {
        var req = await db.Requests.FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new InvalidOperationException($"Request {request.RequestId} not found.");

        if (req.EmployeeId != null)
            throw new InvalidOperationException("Zlecenie jest już przypisane do innego instalatora.");

        var eligible = req.ContractorId == request.ContractorId
            || (req.ContractorId == null && req.ServiceGroupId != null
                && await db.ServiceGroupMembers.AnyAsync(
                    m => m.ServiceGroupId == req.ServiceGroupId.Value && m.ContractorId == request.ContractorId, ct));
        if (!eligible)
            throw new InvalidOperationException("To zlecenie nie jest dostępne do przejęcia przez Twoją firmę.");

        req.Assign(req.ServiceGroupId, request.ContractorId, request.EmployeeId);
        await db.SaveChangesAsync(ct);
        await hubService.NotifyRequestChanged(req.CompanyId, req.Id, ct);
    }
}

public record ChangeRequestStatusCommand(int RequestId, Domain.Enums.RequestStatus Status) : IRequest;

public class ChangeRequestStatusCommandHandler(IApplicationDbContext db, IRequestHubService hubService)
    : IRequestHandler<ChangeRequestStatusCommand>
{
    public async Task Handle(ChangeRequestStatusCommand request, CancellationToken ct)
    {
        var req = await db.Requests.FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new InvalidOperationException($"Request {request.RequestId} not found.");
        req.ChangeStatus(request.Status);
        await db.SaveChangesAsync(ct);
        await hubService.NotifyRequestChanged(req.CompanyId, req.Id, ct);
    }
}

public record SetScheduledDateCommand(int RequestId, DateTime? ScheduledDate) : IRequest;

public class SetScheduledDateCommandHandler(IApplicationDbContext db, IRequestHubService hubService)
    : IRequestHandler<SetScheduledDateCommand>
{
    public async Task Handle(SetScheduledDateCommand request, CancellationToken ct)
    {
        var req = await db.Requests.FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new InvalidOperationException($"Request {request.RequestId} not found.");
        req.SetScheduledDate(request.ScheduledDate);
        await db.SaveChangesAsync(ct);
        await hubService.NotifyRequestChanged(req.CompanyId, req.Id, ct);
    }
}

public record SetCompletionDateCommand(int RequestId, DateTime? CompletionDate) : IRequest;

public class SetCompletionDateCommandHandler(IApplicationDbContext db, IRequestHubService hubService)
    : IRequestHandler<SetCompletionDateCommand>
{
    public async Task Handle(SetCompletionDateCommand request, CancellationToken ct)
    {
        var req = await db.Requests.FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new InvalidOperationException($"Request {request.RequestId} not found.");
        req.SetCompletionDate(request.CompletionDate);
        await db.SaveChangesAsync(ct);
        await hubService.NotifyRequestChanged(req.CompanyId, req.Id, ct);
    }
}

/// <summary>Ocena zadowolenia klienta — wystawiana w aplikacji mobilnej (endpoint gotowy zanim
/// powstanie mobile). Rating=null czyści ocenę.</summary>
public record SetRequestRatingCommand(int RequestId, int? Rating, string? Comment) : IRequest;

public class SetRequestRatingCommandHandler(IApplicationDbContext db, IRequestHubService hubService)
    : IRequestHandler<SetRequestRatingCommand>
{
    public async Task Handle(SetRequestRatingCommand request, CancellationToken ct)
    {
        var req = await db.Requests.FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new InvalidOperationException($"Request {request.RequestId} not found.");
        req.SetRating(request.Rating, request.Comment);
        await db.SaveChangesAsync(ct);
        await hubService.NotifyRequestChanged(req.CompanyId, req.Id, ct);
    }
}

/// <summary>Szablon protokołu dla zlecenia. PrintTemplateId=null wraca do domyślnego szablonu.</summary>
public record SetRequestPrintTemplateCommand(int RequestId, int? PrintTemplateId) : IRequest;

public class SetRequestPrintTemplateCommandHandler(IApplicationDbContext db, IRequestHubService hubService)
    : IRequestHandler<SetRequestPrintTemplateCommand>
{
    public async Task Handle(SetRequestPrintTemplateCommand request, CancellationToken ct)
    {
        var req = await db.Requests.FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new InvalidOperationException($"Request {request.RequestId} not found.");
        if (request.PrintTemplateId is { } templateId
            && !await db.PrintTemplates.AnyAsync(t => t.Id == templateId && t.IsActive, ct))
            throw new InvalidOperationException("Wybrany szablon wydruku nie istnieje lub jest nieaktywny.");
        req.SetPrintTemplate(request.PrintTemplateId);
        await db.SaveChangesAsync(ct);
        await hubService.NotifyRequestChanged(req.CompanyId, req.Id, ct);
    }
}

/// <summary>Adres wykonania zlecenia — niezależny od adresu klienta (np. nowa budowa pod innym
/// adresem niż siedziba/adres korespondencyjny klienta). AddressDto=null czyści adres.</summary>
public record SetRequestAddressCommand(int RequestId, AddressDto? Address) : IRequest;

public class SetRequestAddressCommandHandler(IApplicationDbContext db, IRequestHubService hubService)
    : IRequestHandler<SetRequestAddressCommand>
{
    public async Task Handle(SetRequestAddressCommand request, CancellationToken ct)
    {
        var req = await db.Requests.FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new InvalidOperationException($"Request {request.RequestId} not found.");
        req.SetAddress(await AddressHelper.UpsertAsync(db, req.AddressId, request.Address, ct));
        await db.SaveChangesAsync(ct);
        await hubService.NotifyRequestChanged(req.CompanyId, req.Id, ct);
    }
}
