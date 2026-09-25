using Monterio.Application.Common.Dtos;
using Monterio.Application.Contractors;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Monterio.API.Controllers;

[Tags("Wykonawcy")]
[ApiController]
[Route("api/contractors")]
[Authorize]
public class ContractorsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool onlyActive = false, CancellationToken ct = default)
        => Ok(await sender.Send(new GetContractorsQuery(onlyActive), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContractorRequest body, CancellationToken ct)
    {
        var id = await sender.Send(new CreateContractorCommand(
            body.Name, body.TaxId, body.Phone, body.Email, body.Address), ct);
        return Ok(new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateContractorRequest body, CancellationToken ct)
    {
        await sender.Send(new UpdateContractorCommand(
            id, body.Name, body.TaxId, body.Phone, body.Email, body.IsActive, body.Address), ct);
        return NoContent();
    }
}

public record CreateContractorRequest(string Name, string? TaxId, string? Phone, string? Email, AddressDto? Address = null);
public record UpdateContractorRequest(string Name, string? TaxId, string? Phone, string? Email, bool IsActive, AddressDto? Address = null);
