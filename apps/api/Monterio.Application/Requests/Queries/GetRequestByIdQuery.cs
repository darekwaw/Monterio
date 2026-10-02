using MediatR;
using Microsoft.EntityFrameworkCore;
using Monterio.Application.Common;
using Monterio.Application.Common.Dtos;
using Monterio.Application.Common.Interfaces;

namespace Monterio.Application.Requests.Queries;

public record GetRequestByIdQuery(int Id) : IRequest<RequestDetailDto?>;

public record RequestActivityTaskDto(
    int Id, string Description, bool IsDone, int SortOrder,
    int? MeasurementAttributeId, string? MeasurementAttributeName, int? MeasurementAttributeDataType,
    string? Unit, decimal? MinValue, decimal? MaxValue, string? Options,
    decimal? MeasuredValueDecimal, string? MeasuredValueText, bool? MeasuredValueBoolean,
    DateTime? MeasuredValueDate, DateTime? MeasuredAt, string? MeasuredBy);

public record RequestActivityDto(int Id, string Name, bool IsFinished, List<RequestActivityTaskDto> Tasks);

public record RequestAttachmentDto(int Id, string FileName, string ContentType, long FileSize,
    string UploadedByName, DateTime CreatedAt);

public record RequestDetailDto(
    int Id, string Number, int CompanyId, int CustomerId, string CustomerName, string? CustomerPhone,
    int? LocationId, string? LocationName, AddressDto? Address, string? Description,
    DateTime? ScheduledDate, DateTime? CompletionDate,
    int Status, string StatusName,
    int? ServiceGroupId, string? ServiceGroupName, int? ContractorId, string? ContractorName,
    int? EmployeeId, string? EmployeeName, DateTime CreatedAt,
    int? Rating, string? RatingComment,
    List<RequestActivityDto> Activities, List<RequestAttachmentDto> Attachments);

public class GetRequestByIdQueryHandler(IApplicationDbContext db) : IRequestHandler<GetRequestByIdQuery, RequestDetailDto?>
{
    public async Task<RequestDetailDto?> Handle(GetRequestByIdQuery request, CancellationToken ct)
    {
        var r = await db.Requests
            .Include(x => x.Customer).ThenInclude(c => c.Address)
            .Include(x => x.Location)
            .Include(x => x.Address)
            .Include(x => x.ServiceGroup)
            .Include(x => x.Contractor)
            .Include(x => x.Employee)
            .Include(x => x.Activities).ThenInclude(a => a.Tasks).ThenInclude(t => t.MeasurementAttribute)
            .Include(x => x.Attachments).ThenInclude(a => a.UploadedByEmployee)
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (r is null) return null;

        return new RequestDetailDto(
            r.Id, r.Number, r.CompanyId, r.CustomerId, r.Customer.Name, r.Customer.Phone,
            r.LocationId, r.Location?.Name, AddressHelper.ToDto(r.Address ?? r.Customer.Address), r.Description,
            r.ScheduledDate, r.CompletionDate,
            (int)r.Status, r.Status.ToString(),
            r.ServiceGroupId, r.ServiceGroup?.Name, r.ContractorId, r.Contractor?.Name,
            r.EmployeeId, r.Employee?.FullName, r.CreatedAt,
            r.Rating, r.RatingComment,
            r.Activities.Select(a => new RequestActivityDto(
                a.Id, a.Name, a.IsFinished,
                a.Tasks.OrderBy(t => t.SortOrder).Select(t => new RequestActivityTaskDto(
                    t.Id, t.Description, t.IsDone, t.SortOrder,
                    t.MeasurementAttributeId, t.MeasurementAttribute?.Name,
                    t.MeasurementAttribute == null ? null : (int?)t.MeasurementAttribute.DataType,
                    t.MeasurementAttribute?.Unit, t.MeasurementAttribute?.MinValue, t.MeasurementAttribute?.MaxValue,
                    t.MeasurementAttribute?.Options,
                    t.MeasuredValueDecimal, t.MeasuredValueText, t.MeasuredValueBoolean,
                    t.MeasuredValueDate, t.MeasuredAt, t.MeasuredBy
                )).ToList()
            )).ToList(),
            r.Attachments.OrderByDescending(a => a.CreatedAt).Select(a => new RequestAttachmentDto(
                a.Id, a.FileName, a.ContentType, a.FileSize, a.UploadedByEmployee.FullName, a.CreatedAt
            )).ToList());
    }
}
