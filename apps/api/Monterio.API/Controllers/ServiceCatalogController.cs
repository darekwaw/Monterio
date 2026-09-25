using Monterio.Application.ServiceCatalog;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Monterio.API.Controllers;

[Tags("Katalog usług")]
[ApiController]
[Route("api/service-catalog")]
[Authorize]
public class ServiceCatalogController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool onlyActive = true, CancellationToken ct = default)
        => Ok(await sender.Send(new GetServiceCatalogQuery(onlyActive), ct));

    [HttpPost]
    public async Task<IActionResult> CreateItem([FromBody] CreateServiceCatalogItemCommand body, CancellationToken ct)
    {
        var id = await sender.Send(body, ct);
        return Ok(new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateItem(int id, [FromBody] UpdateItemRequest body, CancellationToken ct)
    {
        await sender.Send(new UpdateServiceCatalogItemCommand(id, body.Name, body.Description, body.IsActive), ct);
        return NoContent();
    }

    [HttpPost("{id:int}/activities")]
    public async Task<IActionResult> AddActivity(int id, [FromBody] AddActivityRequest body, CancellationToken ct)
    {
        var activityId = await sender.Send(new AddServiceActivityCommand(
            id, body.Name, body.SortOrder, body.MeasurementAttributeId), ct);
        return Ok(new { id = activityId });
    }

    [HttpPut("activities/{activityId:int}")]
    public async Task<IActionResult> UpdateActivity(int activityId, [FromBody] UpdateActivityRequest body, CancellationToken ct)
    {
        await sender.Send(new UpdateServiceActivityCommand(activityId, body.Name, body.SortOrder, body.MeasurementAttributeId), ct);
        return NoContent();
    }

    [HttpDelete("activities/{activityId:int}")]
    public async Task<IActionResult> DeleteActivity(int activityId, CancellationToken ct)
    {
        await sender.Send(new DeleteServiceActivityCommand(activityId), ct);
        return NoContent();
    }
}

public record UpdateItemRequest(string Name, string? Description, bool IsActive);
public record AddActivityRequest(string Name, int SortOrder = 0, int? MeasurementAttributeId = null);
public record UpdateActivityRequest(string Name, int SortOrder, int? MeasurementAttributeId);
