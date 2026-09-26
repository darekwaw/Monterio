using Monterio.Application.Employees;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Monterio.API.Controllers;

[Tags("Pracownicy")]
[ApiController]
[Route("api/employees")]
[Authorize]
public class EmployeesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? companyId, [FromQuery] int? contractorId, [FromQuery] bool onlyActive = false,
        CancellationToken ct = default)
        => Ok(await sender.Send(new GetEmployeesQuery(companyId, contractorId, onlyActive), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeCommand body, CancellationToken ct)
    {
        var id = await sender.Send(body, ct);
        return Ok(new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeRequest body, CancellationToken ct)
    {
        await sender.Send(new UpdateEmployeeCommand(id, body.FullName, body.Phone, body.Email, body.IsActive), ct);
        return NoContent();
    }

    [HttpPut("{id:int}/password")]
    public async Task<IActionResult> SetPassword(int id, [FromBody] SetEmployeePasswordRequest body, CancellationToken ct)
    {
        await sender.Send(new SetEmployeePasswordCommand(id, body.NewPassword), ct);
        return NoContent();
    }
}

public record UpdateEmployeeRequest(string FullName, string? Phone, string? Email, bool IsActive);
public record SetEmployeePasswordRequest(string NewPassword);
