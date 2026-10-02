using Monterio.Application.Common;
using Monterio.Application.Common.Dtos;
using Monterio.Application.Common.Models;
using Monterio.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Monterio.Application.Common.Interfaces;

namespace Monterio.Application.Requests.Queries;

public record GetRequestsQuery(
    int? CompanyId = null, RequestStatus? Status = null, int? ServiceGroupId = null, int? ContractorId = null,
    int? EmployeeId = null, string? Search = null, int Page = 1, int PageSize = 50)
    : IRequest<PagedResult<RequestListItemDto>>;

public record RequestListItemDto(
    int Id, string Number, string CustomerName, string? CustomerPhone, AddressDto? Address,
    DateTime? ScheduledDate, DateTime? CompletionDate,
    int Status, string StatusName,
    string? ServiceGroupName, string? ContractorName, string? EmployeeName, DateTime CreatedAt,
    bool IsMine = false, bool CanClaim = false);

public class GetRequestsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetRequestsQuery, PagedResult<RequestListItemDto>>
{
    public async Task<PagedResult<RequestListItemDto>> Handle(GetRequestsQuery request, CancellationToken ct)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = Math.Clamp(request.PageSize, 1, 200);

        var query = db.Requests.AsQueryable();
        if (request.CompanyId.HasValue) query = query.Where(r => r.CompanyId == request.CompanyId.Value);
        if (request.Status.HasValue) query = query.Where(r => r.Status == request.Status.Value);
        if (request.ServiceGroupId.HasValue) query = query.Where(r => r.ServiceGroupId == request.ServiceGroupId.Value);
        if (request.ContractorId.HasValue) query = query.Where(r => r.ContractorId == request.ContractorId.Value);
        if (request.EmployeeId.HasValue) query = query.Where(r => r.EmployeeId == request.EmployeeId.Value);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(r => r.Number.Contains(s) || r.Customer.Name.Contains(s));
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .Include(r => r.Customer).ThenInclude(c => c.Address)
            .Include(r => r.Address)
            .Include(r => r.ServiceGroup)
            .Include(r => r.Contractor).Include(r => r.Employee)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(r => new RequestListItemDto(
                r.Id, r.Number, r.Customer.Name, r.Customer.Phone,
                AddressHelper.ToDto(r.Address ?? r.Customer.Address),
                r.ScheduledDate, r.CompletionDate, (int)r.Status, r.Status.ToString(),
                r.ServiceGroup != null ? r.ServiceGroup.Name : null,
                r.Contractor != null ? r.Contractor.Name : null,
                r.Employee != null ? r.Employee.FullName : null,
                r.CreatedAt))
            .ToListAsync(ct);

        return new PagedResult<RequestListItemDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }
}
