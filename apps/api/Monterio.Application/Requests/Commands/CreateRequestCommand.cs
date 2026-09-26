using Monterio.Application.Common;
using Monterio.Application.Common.Dtos;
using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Requests.Commands;

public record CreateRequestCommand(
    int CompanyId, int CustomerId, int CreatedByEmployeeId,
    string? Description = null, int? LocationId = null, DateTime? ScheduledDate = null,
    IReadOnlyList<int>? ServiceCatalogItemIds = null, AddressDto? Address = null) : IRequest<int>;

public class CreateRequestCommandHandler(
    IApplicationDbContext db, ISender sender, IRequestHubService hubService, IRequestNumberGenerator numberGenerator)
    : IRequestHandler<CreateRequestCommand, int>
{
    public async Task<int> Handle(CreateRequestCommand request, CancellationToken ct)
    {
        var number = await numberGenerator.NextNumberAsync(request.CompanyId, ct);

        var effectiveLocationId = request.LocationId;
        if (!effectiveLocationId.HasValue)
        {
            effectiveLocationId = await db.Customers
                .Where(c => c.Id == request.CustomerId).Select(c => c.LocationId).FirstOrDefaultAsync(ct);
        }

        var req = Request.Create(number, request.CompanyId, request.CustomerId, request.CreatedByEmployeeId,
            request.Description, effectiveLocationId, request.ScheduledDate);

        await db.Requests.AddAsync(req, ct);
        await db.SaveChangesAsync(ct);

        if (request.Address is not null)
        {
            req.SetAddress(await AddressHelper.UpsertAsync(db, null, request.Address, ct));
            await db.SaveChangesAsync(ct);
        }

        if (request.ServiceCatalogItemIds is { Count: > 0 })
            foreach (var itemId in request.ServiceCatalogItemIds)
                await sender.Send(new AddActivityToRequestCommand(req.Id, itemId), ct);

        await hubService.NotifyRequestChanged(req.CompanyId, req.Id, ct);
        return req.Id;
    }
}

public record AddActivityToRequestCommand(int RequestId, int ServiceCatalogItemId) : IRequest<int>;

public class AddActivityToRequestCommandHandler(IApplicationDbContext db, IRequestHubService hubService)
    : IRequestHandler<AddActivityToRequestCommand, int>
{
    public async Task<int> Handle(AddActivityToRequestCommand request, CancellationToken ct)
    {
        var source = await db.ServiceCatalogItems.Include(i => i.Activities)
            .FirstOrDefaultAsync(i => i.Id == request.ServiceCatalogItemId, ct)
            ?? throw new InvalidOperationException($"ServiceCatalogItem {request.ServiceCatalogItemId} not found.");

        var activity = RequestActivity.CreateCopy(request.RequestId, source.Name);
        await db.RequestActivities.AddAsync(activity, ct);
        await db.SaveChangesAsync(ct);

        // Copy-on-assignment: czynności kopiowane teraz, żeby późniejsza edycja katalogu nie
        // zmieniała historii już założonych zleceń. MeasurementAttributeId kopiowany wprost —
        // bez matchowania po kluczu jak w CMMS, bo Monterio nie ma Assetów do disambiguacji.
        foreach (var act in source.Activities.OrderBy(a => a.SortOrder))
            activity.Tasks.Add(RequestActivityTask.Create(activity.Id, act.Name, act.SortOrder, act.MeasurementAttributeId));

        await db.SaveChangesAsync(ct);

        var companyId = await db.Requests.Where(r => r.Id == request.RequestId).Select(r => r.CompanyId).FirstAsync(ct);
        await hubService.NotifyRequestChanged(companyId, request.RequestId, ct);
        return activity.Id;
    }
}

public record RemoveActivityCommand(int RequestId, int ActivityId) : IRequest;

public class RemoveActivityCommandHandler(IApplicationDbContext db, IRequestHubService hubService)
    : IRequestHandler<RemoveActivityCommand>
{
    public async Task Handle(RemoveActivityCommand request, CancellationToken ct)
    {
        var activity = await db.RequestActivities
            .FirstOrDefaultAsync(a => a.Id == request.ActivityId && a.RequestId == request.RequestId, ct)
            ?? throw new InvalidOperationException($"Activity {request.ActivityId} not found.");
        db.RequestActivities.Remove(activity);
        await db.SaveChangesAsync(ct);

        var companyId = await db.Requests.Where(r => r.Id == request.RequestId).Select(r => r.CompanyId).FirstAsync(ct);
        await hubService.NotifyRequestChanged(companyId, request.RequestId, ct);
    }
}
