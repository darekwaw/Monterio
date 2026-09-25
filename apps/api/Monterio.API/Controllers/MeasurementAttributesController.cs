using Monterio.Application.MeasurementAttributes;
using Monterio.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Monterio.API.Controllers;

[Tags("Punkty pomiarowe")]
[ApiController]
[Route("api/measurement-attributes")]
[Authorize]
public class MeasurementAttributesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await sender.Send(new GetMeasurementAttributesQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MeasurementAttributeRequest body, CancellationToken ct)
    {
        var id = await sender.Send(new CreateMeasurementAttributeCommand(
            body.Name, (AttributeDataType)body.DataType, body.Unit, body.MinValue, body.MaxValue, body.Options), ct);
        return Ok(new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] MeasurementAttributeRequest body, CancellationToken ct)
    {
        await sender.Send(new UpdateMeasurementAttributeCommand(
            id, body.Name, (AttributeDataType)body.DataType, body.Unit, body.MinValue, body.MaxValue,
            body.Options, body.IsActive), ct);
        return NoContent();
    }
}

public record MeasurementAttributeRequest(
    string Name, int DataType, string? Unit, decimal? MinValue, decimal? MaxValue,
    string? Options, bool IsActive = true);
