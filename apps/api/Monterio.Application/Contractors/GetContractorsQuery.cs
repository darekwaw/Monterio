using Monterio.Application.Common;
using Monterio.Application.Common.Dtos;
using Monterio.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Contractors;

public record GetContractorsQuery(bool OnlyActive = false) : IRequest<List<ContractorDetailDto>>;

public record ContractorDetailDto(
    int Id, string Name, string? TaxId, string? Phone, string? Email, bool IsActive, AddressDto? Address,
    decimal? AverageRating, int RatingCount);

public class GetContractorsQueryHandler(IApplicationDbContext db) : IRequestHandler<GetContractorsQuery, List<ContractorDetailDto>>
{
    public async Task<List<ContractorDetailDto>> Handle(GetContractorsQuery request, CancellationToken ct)
    {
        var query = db.Contractors.Include(c => c.Address).AsQueryable();
        if (request.OnlyActive) query = query.Where(c => c.IsActive);

        var contractors = await query.OrderBy(c => c.Name).ToListAsync(ct);

        var ratings = await db.Requests
            .Where(r => r.ContractorId != null && r.Rating != null)
            .GroupBy(r => r.ContractorId)
            .Select(g => new { ContractorId = g.Key!.Value, Average = g.Average(r => (decimal)r.Rating!.Value), Count = g.Count() })
            .ToDictionaryAsync(g => g.ContractorId, ct);

        return contractors.Select(c =>
        {
            ratings.TryGetValue(c.Id, out var rating);
            return new ContractorDetailDto(
                c.Id, c.Name, c.TaxId, c.Phone, c.Email, c.IsActive, AddressHelper.ToDto(c.Address),
                rating?.Average, rating?.Count ?? 0);
        }).ToList();
    }
}
