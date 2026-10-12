using Monterio.Application.Common;
using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Requests.Queries;

public record InstallerDashboardCountersDto(int Today, int InProgress, int ToClaim, int ThisWeek, int CompletedThisMonth);

public record InstallerDashboardRatingDto(decimal? Average, int Count, int? LastRating, string? LastComment);

public record InstallerDashboardDto(
    string FullName, string? ContractorName,
    InstallerDashboardCountersDto Counters,
    InstallerDashboardRatingDto Rating,
    RequestListItemDto? NextRequest,
    List<RequestListItemDto> TodayPlan);

/// <summary>Pulpit startowy instalatora na mobile. Liczniki dotyczą WYŁĄCZNIE zleceń przypisanych
/// do niego (EmployeeId = ja), poza "Do przejęcia", które liczy pulę firmy/grupy — z tą samą
/// regułą widoczności co GetInstallerRequestsQuery. Ocena liczy się tylko ze zleceń z jego
/// EmployeeId (patrz CLAUDE.md, sekcja o ocenie). Dni liczone wg czasu serwera.</summary>
public record GetInstallerDashboardQuery(int EmployeeId, int? ContractorId) : IRequest<InstallerDashboardDto>;

public class GetInstallerDashboardQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetInstallerDashboardQuery, InstallerDashboardDto>
{
    public async Task<InstallerDashboardDto> Handle(GetInstallerDashboardQuery request, CancellationToken ct)
    {
        var me = request.EmployeeId;
        var now = DateTime.Now;
        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1);
        var weekStart = todayStart.AddDays(-(((int)todayStart.DayOfWeek + 6) % 7)); // poniedziałek
        var weekEnd = weekStart.AddDays(7);
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var monthEnd = monthStart.AddMonths(1);

        var employee = await db.Employees.Include(e => e.Contractor)
            .FirstAsync(e => e.Id == me, ct);

        var myGroupIds = request.ContractorId.HasValue
            ? await db.ServiceGroupMembers
                .Where(m => m.ContractorId == request.ContractorId.Value)
                .Select(m => m.ServiceGroupId)
                .ToListAsync(ct)
            : [];

        var mine = db.Requests.Where(r => r.EmployeeId == me);
        var open = new[] { RequestStatus.Przypisane, RequestStatus.WTrakcie };

        var pool = db.Requests.Where(r =>
            r.EmployeeId == null && (r.Status == RequestStatus.Nowe || r.Status == RequestStatus.Przypisane)
            && ((request.ContractorId.HasValue && r.ContractorId == request.ContractorId.Value)
                || (r.ContractorId == null && r.ServiceGroupId != null && myGroupIds.Contains(r.ServiceGroupId.Value))));

        var counters = new InstallerDashboardCountersDto(
            Today: await mine.CountAsync(r => r.Status != RequestStatus.Anulowane
                && r.ScheduledDate >= todayStart && r.ScheduledDate < todayEnd, ct),
            InProgress: await mine.CountAsync(r => r.Status == RequestStatus.WTrakcie, ct),
            ToClaim: await pool.CountAsync(ct),
            ThisWeek: await mine.CountAsync(r => open.Contains(r.Status)
                && r.ScheduledDate >= weekStart && r.ScheduledDate < weekEnd, ct),
            CompletedThisMonth: await mine.CountAsync(r => r.Status == RequestStatus.Wykonane
                && r.CompletionDate >= monthStart.ToUniversalTime() && r.CompletionDate < monthEnd.ToUniversalTime(), ct));

        var rated = mine.Where(r => r.Rating != null);
        var ratingCount = await rated.CountAsync(ct);
        decimal? average = ratingCount == 0 ? null : await rated.AverageAsync(r => (decimal)r.Rating!.Value, ct);
        var last = await rated.OrderByDescending(r => r.CompletionDate ?? r.CreatedAt).ThenByDescending(r => r.Id)
            .Select(r => new { r.Rating, r.RatingComment }).FirstOrDefaultAsync(ct);
        var rating = new InstallerDashboardRatingDto(average, ratingCount, last?.Rating, last?.RatingComment);

        IQueryable<RequestListItemDto> Project(IQueryable<Domain.Entities.Request> q) => q
            .Select(r => new RequestListItemDto(
                r.Id, r.Number, r.Customer.Name, r.Customer.Phone,
                AddressHelper.ToDto(r.Address ?? r.Customer.Address),
                r.ScheduledDate, r.CompletionDate, (int)r.Status, r.Status.ToString(),
                r.ServiceGroup != null ? r.ServiceGroup.Name : null,
                r.Contractor != null ? r.Contractor.Name : null,
                r.Employee != null ? r.Employee.FullName : null,
                r.CreatedAt, true, false));

        // Następne: najpierw to, co już trwa, potem najbliższy termin (nie wcześniejszy niż początek dzisiejszego dnia).
        var next = await Project(mine
                .Where(r => r.Status == RequestStatus.WTrakcie
                    || (r.Status == RequestStatus.Przypisane && r.ScheduledDate >= todayStart))
                .OrderBy(r => r.Status == RequestStatus.WTrakcie ? 0 : 1)
                .ThenBy(r => r.ScheduledDate))
            .FirstOrDefaultAsync(ct);

        var todayPlan = await Project(mine
                .Where(r => r.Status != RequestStatus.Anulowane
                    && r.ScheduledDate >= todayStart && r.ScheduledDate < todayEnd)
                .OrderBy(r => r.ScheduledDate))
            .ToListAsync(ct);

        return new InstallerDashboardDto(employee.FullName, employee.Contractor?.Name, counters, rating, next, todayPlan);
    }
}
