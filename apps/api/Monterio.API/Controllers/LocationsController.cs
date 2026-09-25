using Monterio.Application.Common.Dtos;
using Monterio.Application.Locations.Commands;
using Monterio.Application.Locations.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Monterio.API.Controllers;

[Tags("Struktura organizacyjna")]
[ApiController]
[Route("api/locations")]
[Authorize]
public class LocationsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int companyId, CancellationToken ct)
        => Ok(await sender.Send(new GetLocationsQuery(companyId), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLocationRequest body, CancellationToken ct)
    {
        var id = await sender.Send(new CreateLocationCommand(body.CompanyId, body.Name, body.ParentId, body.Address), ct);
        return Ok(new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLocationRequest body, CancellationToken ct)
    {
        await sender.Send(new UpdateLocationCommand(id, body.Name, body.IsActive, body.Address), ct);
        return NoContent();
    }
}

public record CreateLocationRequest(int CompanyId, string Name, int? ParentId, AddressDto? Address = null);
public record UpdateLocationRequest(string Name, bool IsActive, AddressDto? Address = null);
