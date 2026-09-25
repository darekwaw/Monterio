using System.Security.Claims;
using Monterio.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Monterio.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public int? EmployeeId
    {
        get
        {
            var raw = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue("sub");
            return int.TryParse(raw, out var id) ? id : null;
        }
    }

    public string? LoginIdentifier => User?.FindFirstValue("login");

    public string? FullName => User?.FindFirstValue("name");

    public int? CompanyId
    {
        get
        {
            var raw = User?.FindFirstValue("company_id");
            return int.TryParse(raw, out var id) ? id : null;
        }
    }

    public int? ContractorId
    {
        get
        {
            var raw = User?.FindFirstValue("contractor_id");
            return int.TryParse(raw, out var id) ? id : null;
        }
    }

    public bool IsInRole(string role) => User?.IsInRole(role) ?? false;
}
