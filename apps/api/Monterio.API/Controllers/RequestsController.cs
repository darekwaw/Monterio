using Monterio.Application.Common.Dtos;
using Monterio.Application.Common.Interfaces;
using Monterio.Application.Requests.Commands;
using Monterio.Application.Requests.Queries;
using Monterio.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Monterio.API.Controllers;

[Tags("Zlecenia")]
[ApiController]
[Route("api/requests")]
[Authorize]
public class RequestsController(
    ISender sender, ICurrentUserService currentUser, IRatingTokenService ratingTokenService, IConfiguration configuration)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int companyId, [FromQuery] RequestStatus? status, [FromQuery] int? serviceGroupId,
        [FromQuery] int? contractorId, [FromQuery] int? employeeId, [FromQuery] string? search,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
        => Ok(await sender.Send(new GetRequestsQuery(
            companyId, status, serviceGroupId, contractorId, employeeId, search, page, pageSize), ct));

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics(
        [FromQuery] int companyId, [FromQuery] DateTime fromDate, [FromQuery] DateTime toDate,
        [FromQuery] int? locationId, [FromQuery] int? serviceGroupId, [FromQuery] int? contractorId,
        CancellationToken ct)
        => Ok(await sender.Send(new GetRequestAnalyticsQuery(
            companyId, fromDate, toDate, locationId, serviceGroupId, contractorId), ct));

    /// <summary>Zlecenia widoczne dla ZALOGOWANEGO instalatora — dla mobile: "moje" (IsMine=true)
    /// oraz pula do przejęcia (firma/grupa, IsMine=false, CanClaim=true). Employee/ContractorId
    /// biorą się z tokenu (currentUser), nie z parametru zapytania, żeby nikt nie mógł podejrzeć
    /// cudzych przypisań podmieniając id w query stringu.</summary>
    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(
        [FromQuery] RequestStatus? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var employeeId = currentUser.EmployeeId
            ?? throw new InvalidOperationException("Brak zalogowanego pracownika.");
        return Ok(await sender.Send(new GetInstallerRequestsQuery(
            employeeId, currentUser.ContractorId, status, page, pageSize), ct));
    }

    /// <summary>Instalator przejmuje zlecenie z puli (patrz GetMine/GetInstallerRequestsQuery).</summary>
    [HttpPost("{id:int}/claim")]
    public async Task<IActionResult> Claim(int id, CancellationToken ct)
    {
        var employeeId = currentUser.EmployeeId
            ?? throw new InvalidOperationException("Brak zalogowanego pracownika.");
        var contractorId = currentUser.ContractorId
            ?? throw new InvalidOperationException("Tylko instalator (pracownik firmy wykonawczej) może przejmować zlecenia.");
        await sender.Send(new ClaimRequestCommand(id, employeeId, contractorId), ct);
        return NoContent();
    }

    /// <summary>Link do publicznej strony oceny (do wyświetlenia jako QR na ekranie instalatora,
    /// patrz PublicRatingController) — token liczony deterministycznie z RequestId, nic nie trzeba
    /// zapisywać w bazie.</summary>
    [HttpGet("{id:int}/rating-link")]
    public IActionResult GetRatingLink(int id)
    {
        var token = ratingTokenService.GenerateToken(id);
        var baseUrl = configuration["RatingLink:WebBaseUrl"]?.TrimEnd('/')
            ?? throw new InvalidOperationException("Brak RatingLink:WebBaseUrl w konfiguracji.");
        return Ok(new { url = $"{baseUrl}/ocena/{id}?token={token}" });
    }

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

    [HttpPut("{id:int}/print-template")]
    public async Task<IActionResult> SetPrintTemplate(int id, [FromBody] SetRequestPrintTemplateRequest body, CancellationToken ct)
    {
        await sender.Send(new SetRequestPrintTemplateCommand(id, body.PrintTemplateId), ct);
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
public record SetRequestPrintTemplateRequest(int? PrintTemplateId);
public record SetRequestRatingRequest(int? Rating, string? Comment = null);
public record CompleteMeasurementRequest(
    decimal? ValueDecimal = null, string? ValueText = null, bool? ValueBoolean = null, DateTime? ValueDate = null);
