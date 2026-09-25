using Monterio.Application.Common;
using Monterio.Application.Common.Dtos;
using Monterio.Application.Common.Interfaces;
using Monterio.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Customers;

public record GetCustomersQuery(
    int CompanyId, string? Search = null, int Page = 1, int PageSize = 50) : IRequest<PagedResult<CustomerDto>>;

public record CustomerDto(int Id, int CompanyId, int? LocationId, string? LocationName,
    string Name, string? Phone, string? Email, bool IsActive);

public class GetCustomersQueryHandler(IApplicationDbContext db) : IRequestHandler<GetCustomersQuery, PagedResult<CustomerDto>>
{
    private static string EscapeLikePattern(string value) => value
        .Replace("[", "[[]").Replace("%", "[%]").Replace("_", "[_]");

    public async Task<PagedResult<CustomerDto>> Handle(GetCustomersQuery request, CancellationToken ct)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = Math.Clamp(request.PageSize, 1, 200);

        var query = db.Customers.Where(c => c.CompanyId == request.CompanyId && c.IsActive);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var pattern = EscapeLikePattern(request.Search.Trim()) + "%";
            query = query.Where(c => EF.Functions.Like(c.Name, pattern));
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .Include(c => c.Location)
            .OrderBy(c => c.Name).ThenBy(c => c.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(c => new CustomerDto(
                c.Id, c.CompanyId, c.LocationId, c.Location != null ? c.Location.Name : null,
                c.Name, c.Phone, c.Email, c.IsActive))
            .ToListAsync(ct);

        return new PagedResult<CustomerDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }
}

public record GetCustomerByIdQuery(int Id) : IRequest<CustomerDetailDto?>;

public record CustomerDetailDto(int Id, int CompanyId, int? LocationId, string? LocationName,
    string Name, string? Phone, string? Email, bool IsActive, AddressDto? Address);

public class GetCustomerByIdQueryHandler(IApplicationDbContext db) : IRequestHandler<GetCustomerByIdQuery, CustomerDetailDto?>
{
    public async Task<CustomerDetailDto?> Handle(GetCustomerByIdQuery request, CancellationToken ct)
    {
        var c = await db.Customers.Include(x => x.Location).Include(x => x.Address)
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);
        if (c is null) return null;

        return new CustomerDetailDto(c.Id, c.CompanyId, c.LocationId, c.Location?.Name,
            c.Name, c.Phone, c.Email, c.IsActive, AddressHelper.ToDto(c.Address));
    }
}
