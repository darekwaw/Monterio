using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Requests.Queries;

public record GetRequestAnalyticsQuery(
    int CompanyId, DateTime FromDate, DateTime ToDate,
    int? LocationId = null, int? ServiceGroupId = null, int? ContractorId = null)
    : IRequest<RequestAnalyticsDto>;

public record RequestStatusBreakdownDto(int Status, string StatusName, int Count);

/// <summary>Miesięczny słupek: Created = zlecenia utworzone w tym miesiącu (baza filtrowania zakresu dat),
/// Completed/OnTime/Early/Late liczone tylko wśród nich, tam gdzie zlecenie ma status Wykonane
/// i obie daty (planowaną i faktyczną) ustawione.</summary>
public record RequestMonthlyStatDto(int Year, int Month, int Created, int Completed, int OnTime, int Early, int Late);

public record ContractorAnalyticsDto(int ContractorId, string Name, int RequestCount, decimal? AverageRating, int RatingCount);
public record EmployeeAnalyticsDto(int EmployeeId, string Name, int RequestCount, decimal? AverageRating, int RatingCount);

public record RequestAnalyticsDto(
    int TotalRequests,
    IReadOnlyList<RequestStatusBreakdownDto> StatusBreakdown,
    IReadOnlyList<RequestMonthlyStatDto> Monthly,
    int OnTimeCount, int EarlyCount, int LateCount,
    IReadOnlyList<ContractorAnalyticsDto> ContractorRanking,
    IReadOnlyList<EmployeeAnalyticsDto> EmployeeRanking);

public class GetRequestAnalyticsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetRequestAnalyticsQuery, RequestAnalyticsDto>
{
    public async Task<RequestAnalyticsDto> Handle(GetRequestAnalyticsQuery request, CancellationToken ct)
    {
        var from = request.FromDate.Date;
        var to = request.ToDate.Date.AddDays(1).AddTicks(-1);

        var query = db.Requests.Where(r =>
            r.CompanyId == request.CompanyId && r.CreatedAt >= from && r.CreatedAt <= to);
        if (request.LocationId.HasValue) query = query.Where(r => r.LocationId == request.LocationId.Value);
        if (request.ServiceGroupId.HasValue) query = query.Where(r => r.ServiceGroupId == request.ServiceGroupId.Value);
        if (request.ContractorId.HasValue) query = query.Where(r => r.ContractorId == request.ContractorId.Value);

        var rows = await query
            .Select(r => new
            {
                r.CreatedAt, r.ScheduledDate, r.CompletionDate, r.Status, r.Rating,
                r.ContractorId, ContractorName = r.Contractor != null ? r.Contractor.Name : null,
                r.EmployeeId, EmployeeName = r.Employee != null ? r.Employee.FullName : null,
            })
            .ToListAsync(ct);

        var statusCounts = rows.GroupBy(r => r.Status).ToDictionary(g => g.Key, g => g.Count());
        var statusBreakdown = Enum.GetValues<RequestStatus>()
            .Select(s => new RequestStatusBreakdownDto((int)s, s.ToString(), statusCounts.GetValueOrDefault(s)))
            .ToList();

        var monthly = rows
            .GroupBy(r => new { r.CreatedAt.Year, r.CreatedAt.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g =>
            {
                var completed = g.Where(r => r.ScheduledDate.HasValue && r.CompletionDate.HasValue).ToList();
                int onTime = 0, early = 0, late = 0;
                foreach (var r in completed)
                {
                    var diff = (r.CompletionDate!.Value.Date - r.ScheduledDate!.Value.Date).Days;
                    if (diff == 0) onTime++;
                    else if (diff < 0) early++;
                    else late++;
                }
                return new RequestMonthlyStatDto(g.Key.Year, g.Key.Month, g.Count(), completed.Count, onTime, early, late);
            })
            .ToList();

        var contractorRanking = rows
            .Where(r => r.ContractorId.HasValue)
            .GroupBy(r => new { r.ContractorId, r.ContractorName })
            .Select(g => new ContractorAnalyticsDto(
                g.Key.ContractorId!.Value, g.Key.ContractorName ?? "—", g.Count(),
                g.Any(r => r.Rating.HasValue) ? (decimal?)g.Where(r => r.Rating.HasValue).Average(r => r.Rating!.Value) : null,
                g.Count(r => r.Rating.HasValue)))
            .OrderByDescending(d => d.RequestCount)
            .ToList();

        var employeeRanking = rows
            .Where(r => r.EmployeeId.HasValue)
            .GroupBy(r => new { r.EmployeeId, r.EmployeeName })
            .Select(g => new EmployeeAnalyticsDto(
                g.Key.EmployeeId!.Value, g.Key.EmployeeName ?? "—", g.Count(),
                g.Any(r => r.Rating.HasValue) ? (decimal?)g.Where(r => r.Rating.HasValue).Average(r => r.Rating!.Value) : null,
                g.Count(r => r.Rating.HasValue)))
            .OrderByDescending(d => d.RequestCount)
            .ToList();

        return new RequestAnalyticsDto(
            rows.Count, statusBreakdown, monthly,
            monthly.Sum(m => m.OnTime), monthly.Sum(m => m.Early), monthly.Sum(m => m.Late),
            contractorRanking, employeeRanking);
    }
}
