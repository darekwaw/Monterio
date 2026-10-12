using Monterio.Application.Common.Interfaces;
using Monterio.Application.Requests.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Monterio.API.Controllers;

[Tags("Moje konto")]
[ApiController]
[Route("api/me")]
[Authorize]
public class MeController(ISender sender, ICurrentUserService currentUser) : ControllerBase
{
    /// <summary>Pulpit startowy instalatora (mobile). Tożsamość z tokenu, nie z parametru zapytania —
    /// tak samo jak GET /api/requests/mine.</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken ct)
    {
        var employeeId = currentUser.EmployeeId
            ?? throw new InvalidOperationException("Brak zalogowanego pracownika.");
        if (currentUser.ContractorId is null)
            return Forbid();
        return Ok(await sender.Send(new GetInstallerDashboardQuery(employeeId, currentUser.ContractorId), ct));
    }
}
