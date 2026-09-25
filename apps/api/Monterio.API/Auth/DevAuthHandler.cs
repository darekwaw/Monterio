using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace Monterio.API.Auth;

/// <summary>Handler autoryzacji dla środowiska deweloperskiego — fikcyjny dyspozytor-admin, bez
/// potrzeby tokenu JWT. NIGDY nie używać na produkcji.</summary>
public class DevAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "DevAuth";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim("sub", "1"),
            new Claim("name", "Dev Dispatcher"),
            new Claim("login", "dev"),
            new Claim("company_id", "1"),
            new Claim("role", "Dispatcher"),
            new Claim(ClaimTypes.Role, "Dispatcher"),
        };

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
