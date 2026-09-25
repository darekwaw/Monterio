using Monterio.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.ServiceCatalog;

public record GetServiceCatalogQuery(bool OnlyActive = true) : IRequest<List<ServiceCatalogItemDto>>;

public record ServiceActivityDto(int Id, string Name, int SortOrder,
    int? MeasurementAttributeId, string? MeasurementAttributeName, string? Unit,
    decimal? MinValue, decimal? MaxValue);

public record ServiceCatalogItemDto(int Id, string Name, string? Description, bool IsActive,
    List<ServiceActivityDto> Activities);

public class GetServiceCatalogQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetServiceCatalogQuery, List<ServiceCatalogItemDto>>
{
    public async Task<List<ServiceCatalogItemDto>> Handle(GetServiceCatalogQuery request, CancellationToken ct)
    {
        var query = db.ServiceCatalogItems
            .Include(i => i.Activities).ThenInclude(a => a.MeasurementAttribute)
            .AsQueryable();
        if (request.OnlyActive) query = query.Where(i => i.IsActive);

        var items = await query.OrderBy(i => i.Name).ToListAsync(ct);

        return items.Select(i => new ServiceCatalogItemDto(
            i.Id, i.Name, i.Description, i.IsActive,
            i.Activities.OrderBy(a => a.SortOrder).Select(a => new ServiceActivityDto(
                a.Id, a.Name, a.SortOrder, a.MeasurementAttributeId, a.MeasurementAttribute?.Name,
                a.MeasurementAttribute?.Unit, a.MeasurementAttribute?.MinValue, a.MeasurementAttribute?.MaxValue
            )).ToList()
        )).ToList();
    }
}
