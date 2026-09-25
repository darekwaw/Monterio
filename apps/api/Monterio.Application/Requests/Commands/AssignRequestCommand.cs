using Monterio.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Requests.Commands;

/// <summary>Dokładnie jeden poziom przypisania naraz: grupa, ALBO firma w grupie, ALBO konkretny
/// pracownik firmy. Pozostałe pola trzeba jawnie wyzerować (null), nie są domyślnie czyszczone.</summary>
public record AssignRequestCommand(int RequestId, int? ServiceGroupId, int? ContractorId, int? EmployeeId) : IRequest;

public class AssignRequestCommandHandler(IApplicationDbContext db) : IRequestHandler<AssignRequestCommand>
{
    public async Task Handle(AssignRequestCommand request, CancellationToken ct)
    {
        var req = await db.Requests.FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new InvalidOperationException($"Request {request.RequestId} not found.");
        req.Assign(request.ServiceGroupId, request.ContractorId, request.EmployeeId);
        await db.SaveChangesAsync(ct);
    }
}

public record ChangeRequestStatusCommand(int RequestId, Domain.Enums.RequestStatus Status) : IRequest;

public class ChangeRequestStatusCommandHandler(IApplicationDbContext db) : IRequestHandler<ChangeRequestStatusCommand>
{
    public async Task Handle(ChangeRequestStatusCommand request, CancellationToken ct)
    {
        var req = await db.Requests.FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new InvalidOperationException($"Request {request.RequestId} not found.");
        req.ChangeStatus(request.Status);
        await db.SaveChangesAsync(ct);
    }
}

public record SetScheduledDateCommand(int RequestId, DateTime? ScheduledDate) : IRequest;

public class SetScheduledDateCommandHandler(IApplicationDbContext db) : IRequestHandler<SetScheduledDateCommand>
{
    public async Task Handle(SetScheduledDateCommand request, CancellationToken ct)
    {
        var req = await db.Requests.FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new InvalidOperationException($"Request {request.RequestId} not found.");
        req.SetScheduledDate(request.ScheduledDate);
        await db.SaveChangesAsync(ct);
    }
}
