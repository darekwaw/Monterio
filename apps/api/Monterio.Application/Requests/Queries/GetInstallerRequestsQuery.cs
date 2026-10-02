using Monterio.Application.Common;
using Monterio.Application.Common.Models;
using Monterio.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Monterio.Application.Common.Interfaces;

namespace Monterio.Application.Requests.Queries;

/// <summary>Zlecenia widoczne dla instalatora na mobile: "moje" (EmployeeId = ja) ORAZ pula do
/// przejęcia — nieprzypisane do konkretnej osoby, ale trafiające do jego firmy (ContractorId) albo
/// do grupy serwisowej, do której jego firma należy (ServiceGroupMembers). Odwrotność
/// GetRequestsQuery, który dla dyspozytora/weba filtruje ściśle, bez puli.</summary>
public record GetInstallerRequestsQuery(int EmployeeId, int? ContractorId, RequestStatus? Status = null,
    int Page = 1, int PageSize = 100) : IRequest<PagedResult<RequestListItemDto>>;

public class GetInstallerRequestsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetInstallerRequestsQuery, PagedResult<RequestListItemDto>>
{
    public async Task<PagedResult<RequestListItemDto>> Handle(GetInstallerRequestsQuery request, CancellationToken ct)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = Math.Clamp(request.PageSize, 1, 200);

        var myGroupIds = request.ContractorId.HasValue
            ? await db.ServiceGroupMembers
                .Where(m => m.ContractorId == request.ContractorId.Value)
                .Select(m => m.ServiceGroupId)
                .ToListAsync(ct)
            : [];

        var query = db.Requests.Where(r =>
            r.EmployeeId == request.EmployeeId
            || (r.EmployeeId == null && request.ContractorId.HasValue && r.ContractorId == request.ContractorId.Value)
            || (r.EmployeeId == null && r.ContractorId == null && r.ServiceGroupId != null
                && myGroupIds.Contains(r.ServiceGroupId.Value)));

        if (request.Status.HasValue) query = query.Where(r => r.Status == request.Status.Value);

        var total = await query.CountAsync(ct);

        var items = await query
            .Include(r => r.Customer).ThenInclude(c => c.Address)
            .Include(r => r.Address)
            .Include(r => r.ServiceGroup).Include(r => r.Contractor).Include(r => r.Employee)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(r => new RequestListItemDto(
                r.Id, r.Number, r.Customer.Name, r.Customer.Phone,
                AddressHelper.ToDto(r.Address ?? r.Customer.Address),
                r.ScheduledDate, r.CompletionDate, (int)r.Status, r.Status.ToString(),
                r.ServiceGroup != null ? r.ServiceGroup.Name : null,
                r.Contractor != null ? r.Contractor.Name : null,
                r.Employee != null ? r.Employee.FullName : null,
                r.CreatedAt,
                r.EmployeeId == request.EmployeeId,
                r.EmployeeId == null))
            .ToListAsync(ct);

        return new PagedResult<RequestListItemDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }
}
