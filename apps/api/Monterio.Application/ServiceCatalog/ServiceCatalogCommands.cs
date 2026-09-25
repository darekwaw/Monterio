using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.ServiceCatalog;

public record CreateServiceCatalogItemCommand(string Name, string? Description = null) : IRequest<int>;

public class CreateServiceCatalogItemCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateServiceCatalogItemCommand, int>
{
    public async Task<int> Handle(CreateServiceCatalogItemCommand request, CancellationToken ct)
    {
        var item = ServiceCatalogItem.Create(request.Name, request.Description);
        await db.ServiceCatalogItems.AddAsync(item, ct);
        await db.SaveChangesAsync(ct);
        return item.Id;
    }
}

public record UpdateServiceCatalogItemCommand(int Id, string Name, string? Description, bool IsActive) : IRequest;

public class UpdateServiceCatalogItemCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateServiceCatalogItemCommand>
{
    public async Task Handle(UpdateServiceCatalogItemCommand request, CancellationToken ct)
    {
        var item = await db.ServiceCatalogItems.FirstOrDefaultAsync(i => i.Id == request.Id, ct)
            ?? throw new InvalidOperationException($"ServiceCatalogItem {request.Id} not found.");
        item.Update(request.Name, request.Description, request.IsActive);
        await db.SaveChangesAsync(ct);
    }
}

public record AddServiceActivityCommand(
    int ServiceCatalogItemId, string Name, int SortOrder = 0, int? MeasurementAttributeId = null) : IRequest<int>;

public class AddServiceActivityCommandHandler(IApplicationDbContext db) : IRequestHandler<AddServiceActivityCommand, int>
{
    public async Task<int> Handle(AddServiceActivityCommand request, CancellationToken ct)
    {
        var activity = ServiceActivity.Create(request.ServiceCatalogItemId, request.Name,
            request.SortOrder, request.MeasurementAttributeId);
        await db.ServiceActivities.AddAsync(activity, ct);
        await db.SaveChangesAsync(ct);
        return activity.Id;
    }
}

public record UpdateServiceActivityCommand(
    int Id, string Name, int SortOrder, int? MeasurementAttributeId) : IRequest;

public class UpdateServiceActivityCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateServiceActivityCommand>
{
    public async Task Handle(UpdateServiceActivityCommand request, CancellationToken ct)
    {
        var activity = await db.ServiceActivities.FirstOrDefaultAsync(a => a.Id == request.Id, ct)
            ?? throw new InvalidOperationException($"ServiceActivity {request.Id} not found.");
        activity.Update(request.Name, request.SortOrder, request.MeasurementAttributeId);
        await db.SaveChangesAsync(ct);
    }
}

public record DeleteServiceActivityCommand(int Id) : IRequest;

public class DeleteServiceActivityCommandHandler(IApplicationDbContext db) : IRequestHandler<DeleteServiceActivityCommand>
{
    public async Task Handle(DeleteServiceActivityCommand request, CancellationToken ct)
    {
        var activity = await db.ServiceActivities.FirstOrDefaultAsync(a => a.Id == request.Id, ct)
            ?? throw new InvalidOperationException($"ServiceActivity {request.Id} not found.");
        db.ServiceActivities.Remove(activity);
        await db.SaveChangesAsync(ct);
    }
}
