using Monterio.Application.Common.Dtos;
using Monterio.Application.Common.Interfaces;
using Monterio.Application.Requests.Commands;
using Monterio.Application.Requests.Queries;
using Monterio.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Monterio.API.Controllers;

[Tags("Zlecenia")]
[ApiController]
[Route("api/requests")]
[Authorize]
public class RequestsController(ISender sender, ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int companyId, [FromQuery] RequestStatus? status, [FromQuery] int? serviceGroupId,
        [FromQuery] int? contractorId, [FromQuery] int? employeeId, [FromQuery] string? search,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
        => Ok(await sender.Send(new GetRequestsQuery(
            companyId, status, serviceGroupId, contractorId, employeeId, search, page, pageSize), ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await sender.Send(new GetRequestByIdQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRequestRequest body, CancellationToken ct)
    {
        var employeeId = currentUser.EmployeeId
            ?? throw new InvalidOperationException("Brak zalogowanego pracownika.");
        var id = await sender.Send(new CreateRequestCommand(
            body.CompanyId, body.CustomerId, employeeId, body.Description, body.LocationId,
            body.ScheduledDate, body.ServiceCatalogItemIds, body.Address), ct);
        return Ok(new { id });
    }

    [HttpPost("{id:int}/activities")]
    public async Task<IActionResult> AddActivity(int id, [FromBody] AddRequestActivityRequest body, CancellationToken ct)
    {
        var activityId = await sender.Send(new AddActivityToRequestCommand(id, body.ServiceCatalogItemId), ct);
        return Ok(new { id = activityId });
    }

    [HttpDelete("{id:int}/activities/{activityId:int}")]
    public async Task<IActionResult> RemoveActivity(int id, int activityId, CancellationToken ct)
    {
        await sender.Send(new RemoveActivityCommand(id, activityId), ct);
        return NoContent();
    }

    [HttpPost("{id:int}/assign")]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignRequestRequest body, CancellationToken ct)
    {
        await sender.Send(new AssignRequestCommand(id, body.ServiceGroupId, body.ContractorId, body.EmployeeId), ct);
        return NoContent();
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> ChangeStatus(int id, [FromBody] ChangeStatusRequest body, CancellationToken ct)
    {
        await sender.Send(new ChangeRequestStatusCommand(id, body.Status), ct);
        return NoContent();
    }

    [HttpPut("{id:int}/scheduled-date")]
    public async Task<IActionResult> SetScheduledDate(int id, [FromBody] SetScheduledDateRequest body, CancellationToken ct)
    {
        await sender.Send(new SetScheduledDateCommand(id, body.ScheduledDate), ct);
        return NoContent();
    }

    [HttpPut("{id:int}/completion-date")]
    public async Task<IActionResult> SetCompletionDate(int id, [FromBody] SetCompletionDateRequest body, CancellationToken ct)
    {
        await sender.Send(new SetCompletionDateCommand(id, body.CompletionDate), ct);
        return NoContent();
    }

    [HttpPut("{id:int}/rating")]
    public async Task<IActionResult> SetRating(int id, [FromBody] SetRequestRatingRequest body, CancellationToken ct)
    {
        await sender.Send(new SetRequestRatingCommand(id, body.Rating, body.Comment), ct);
        return NoContent();
    }

    [HttpPut("{id:int}/address")]
    public async Task<IActionResult> SetAddress(int id, [FromBody] SetRequestAddressRequest body, CancellationToken ct)
    {
        await sender.Send(new SetRequestAddressCommand(id, body.Address), ct);
        return NoContent();
    }

    [HttpPost("{id:int}/activities/{activityId:int}/tasks/{taskId:int}/toggle")]
    public async Task<IActionResult> ToggleTask(int id, int activityId, int taskId, CancellationToken ct)
    {
        await sender.Send(new ToggleTaskCommand(id, activityId, taskId), ct);
        return NoContent();
    }

    [HttpPost("{id:int}/activities/{activityId:int}/tasks/{taskId:int}/measurement")]
    public async Task<IActionResult> CompleteMeasurement(
        int id, int activityId, int taskId, [FromBody] CompleteMeasurementRequest body, CancellationToken ct)
    {
        var result = await sender.Send(new CompleteMeasurementTaskCommand(
            id, activityId, taskId, body.ValueDecimal, body.ValueText, body.ValueBoolean, body.ValueDate), ct);
        return Ok(result);
    }

    [HttpPost("{id:int}/attachments")]
    [RequestSizeLimit(52_428_800)]
    public async Task<IActionResult> UploadAttachment(int id, IFormFile file, CancellationToken ct)
    {
        var employeeId = currentUser.EmployeeId
            ?? throw new InvalidOperationException("Brak zalogowanego pracownika.");

        using var stream = new MemoryStream();
        await file.CopyToAsync(stream, ct);

        var attachmentId = await sender.Send(new UploadAttachmentCommand(
            id, file.FileName, file.ContentType, stream.ToArray(), employeeId), ct);
        return Ok(new { id = attachmentId });
    }

    [HttpGet("{id:int}/attachments/{attachmentId:int}")]
    public async Task<IActionResult> DownloadAttachment(int id, int attachmentId, CancellationToken ct)
    {
        var result = await sender.Send(new Monterio.Application.Requests.Queries.GetAttachmentQuery(id, attachmentId), ct);
        return result is null ? NotFound() : File(result.Content, result.ContentType, result.FileName);
    }

    [HttpGet("{id:int}/protocol.pdf")]
    public async Task<IActionResult> DownloadProtocol(int id, CancellationToken ct)
    {
        var result = await sender.Send(new Monterio.Application.Requests.Queries.GetRequestProtocolQuery(id), ct);
        return result is null
            ? NotFound(new { message = "Brak domyślnego, aktywnego szablonu wydruku. Zdefiniuj szablon w Szablonach wydruku." })
            : File(result.Content, "application/pdf", result.FileName);
    }
}

public record CreateRequestRequest(
    int CompanyId, int CustomerId, string? Description, int? LocationId, DateTime? ScheduledDate,
    IReadOnlyList<int>? ServiceCatalogItemIds = null, AddressDto? Address = null);
public record AddRequestActivityRequest(int ServiceCatalogItemId);
public record AssignRequestRequest(int? ServiceGroupId, int? ContractorId, int? EmployeeId);
public record ChangeStatusRequest(RequestStatus Status);
public record SetScheduledDateRequest(DateTime? ScheduledDate);
public record SetCompletionDateRequest(DateTime? CompletionDate);
public record SetRequestAddressRequest(AddressDto? Address);
public record SetRequestRatingRequest(int? Rating, string? Comment = null);
public record CompleteMeasurementRequest(
    decimal? ValueDecimal = null, string? ValueText = null, bool? ValueBoolean = null, DateTime? ValueDate = null);
