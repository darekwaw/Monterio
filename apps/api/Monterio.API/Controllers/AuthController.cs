using Monterio.Application.Auth.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Monterio.API.Controllers;

[Tags("Autentykacja")]
[ApiController]
[Route("api/auth")]
public class AuthController(ISender sender) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.LoginIdentifier) || string.IsNullOrWhiteSpace(body.Password))
            return BadRequest(new { error = "Login i hasło są wymagane." });

        var result = await sender.Send(new LoginCommand(body.LoginIdentifier, body.Password), ct);
        if (!result.Success) return Unauthorized(new { error = result.Error });

        return Ok(new
        {
            token = result.Token,
            expiresIn = result.ExpiresInMinutes * 60,
            employeeId = result.EmployeeId,
            fullName = result.FullName,
            role = result.Role,
            companyId = result.CompanyId,
            contractorId = result.ContractorId,
        });
    }

    [HttpPost("login-pin")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginByPin([FromBody] LoginByPinRequest body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.LoginIdentifier) || string.IsNullOrWhiteSpace(body.Pin))
            return BadRequest(new { error = "Login i PIN są wymagane." });

        var result = await sender.Send(new LoginByPinCommand(body.LoginIdentifier, body.Pin), ct);
        if (!result.Success) return Unauthorized(new { error = result.Error });

        return Ok(new
        {
            token = result.Token,
            expiresIn = result.ExpiresInMinutes * 60,
            employeeId = result.EmployeeId,
            fullName = result.FullName,
            role = result.Role,
            companyId = result.CompanyId,
            contractorId = result.ContractorId,
        });
    }
}

public record LoginRequest(string LoginIdentifier, string Password);
public record LoginByPinRequest(string LoginIdentifier, string Pin);
