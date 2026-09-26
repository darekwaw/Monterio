using Monterio.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.ServiceGroups;

public record GetServiceGroupsQuery(int? LocationId = null) : IRequest<List<ServiceGroupDto>>;

public record ServiceGroupDto(int Id, int LocationId, string LocationName, string Name, bool IsActive, int MemberCount);

public class GetServiceGroupsQueryHandler(IApplicationDbContext db) : IRequestHandler<GetServiceGroupsQuery, List<ServiceGroupDto>>
{
    public async Task<List<ServiceGroupDto>> Handle(GetServiceGroupsQuery request, CancellationToken ct)
    {
        var query = db.ServiceGroups.Include(g => g.Location).AsQueryable();
        if (request.LocationId.HasValue)
            query = query.Where(g => g.LocationId == request.LocationId.Value);

        var groups = await query.OrderBy(g => g.Name).ToListAsync(ct);
        var ids = groups.Select(g => g.Id).ToList();
        var counts = await db.ServiceGroupMembers
            .Where(m => ids.Contains(m.ServiceGroupId))
            .GroupBy(m => m.ServiceGroupId)
            .Select(g => new { ServiceGroupId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ServiceGroupId, x => x.Count, ct);

        return groups.Select(g => new ServiceGroupDto(
            g.Id, g.LocationId, g.Location.Name, g.Name, g.IsActive, counts.GetValueOrDefault(g.Id))).ToList();
    }
}

public record GetServiceGroupMembersQuery(int ServiceGroupId) : IRequest<List<ContractorSummaryDto>>;

public record ContractorSummaryDto(
    int Id, string Name, string? Phone, bool IsActive, int EmployeeCount,
    decimal? AverageRating, int RatingCount);

public class GetServiceGroupMembersQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetServiceGroupMembersQuery, List<ContractorSummaryDto>>
{
    public async Task<List<ContractorSummaryDto>> Handle(GetServiceGroupMembersQuery request, CancellationToken ct)
    {
        var contractorIds = await db.ServiceGroupMembers
            .Where(m => m.ServiceGroupId == request.ServiceGroupId)
            .Select(m => m.ContractorId)
            .ToListAsync(ct);

        var contractors = await db.Contractors
            .Where(c => contractorIds.Contains(c.Id))
            .ToListAsync(ct);

        var empCounts = await db.Employees
            .Where(e => e.ContractorId != null && contractorIds.Contains(e.ContractorId.Value) && e.IsActive)
            .GroupBy(e => e.ContractorId!.Value)
            .Select(g => new { ContractorId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ContractorId, x => x.Count, ct);

        var ratings = await db.Requests
            .Where(r => r.ContractorId != null && contractorIds.Contains(r.ContractorId.Value) && r.Rating != null)
            .GroupBy(r => r.ContractorId)
            .Select(g => new { ContractorId = g.Key!.Value, Average = g.Average(r => (decimal)r.Rating!.Value), Count = g.Count() })
            .ToDictionaryAsync(g => g.ContractorId, ct);

        return contractors.Select(c =>
        {
            ratings.TryGetValue(c.Id, out var rating);
            return new ContractorSummaryDto(
                c.Id, c.Name, c.Phone, c.IsActive, empCounts.GetValueOrDefault(c.Id),
                rating?.Average, rating?.Count ?? 0);
        }).ToList();
    }
}
