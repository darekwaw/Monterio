using Monterio.Application.Common;
using Monterio.Application.Common.Dtos;
using Monterio.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Locations.Queries;

/// <summary>Całe drzewo lokalizacji firmy naraz — lista lokalizacji jest krótka (dziesiątki,
/// nie tysiące), więc w odróżnieniu od CMMS nie trzeba stronicować ani ładować poziomami.</summary>
public record GetLocationsQuery(int CompanyId) : IRequest<List<LocationDto>>;

public record LocationDto(int Id, int CompanyId, int? ParentId, string Name, string Path, int Level,
    bool IsActive, AddressDto? Address);

public class GetLocationsQueryHandler(IApplicationDbContext db) : IRequestHandler<GetLocationsQuery, List<LocationDto>>
{
    public async Task<List<LocationDto>> Handle(GetLocationsQuery request, CancellationToken ct)
    {
        var locations = await db.Locations
            .Include(l => l.Address)
            .Where(l => l.CompanyId == request.CompanyId)
            .OrderBy(l => l.Path)
            .ToListAsync(ct);

        return locations.Select(l => new LocationDto(
            l.Id, l.CompanyId, l.ParentId, l.Name, l.Path, l.Level, l.IsActive,
            AddressHelper.ToDto(l.Address))).ToList();
    }
}
