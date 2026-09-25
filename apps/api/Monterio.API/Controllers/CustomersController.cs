using Monterio.Application.Common.Dtos;
using Monterio.Application.Customers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Monterio.API.Controllers;

[Tags("Klienci")]
[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomersController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int companyId, [FromQuery] string? search, [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50, CancellationToken ct = default)
        => Ok(await sender.Send(new GetCustomersQuery(companyId, search, page, pageSize), ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await sender.Send(new GetCustomerByIdQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest body, CancellationToken ct)
    {
        var id = await sender.Send(new CreateCustomerCommand(
            body.CompanyId, body.Name, body.LocationId, body.Phone, body.Email, body.Address), ct);
        return Ok(new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCustomerRequest body, CancellationToken ct)
    {
        await sender.Send(new UpdateCustomerCommand(
            id, body.Name, body.Phone, body.Email, body.LocationId, body.IsActive, body.Address), ct);
        return NoContent();
    }
}

public record CreateCustomerRequest(
    int CompanyId, string Name, int? LocationId, string? Phone, string? Email, AddressDto? Address = null);
public record UpdateCustomerRequest(
    string Name, string? Phone, string? Email, int? LocationId, bool IsActive, AddressDto? Address = null);
