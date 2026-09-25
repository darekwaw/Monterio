using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Monterio.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Monterio.Infrastructure.Services;

public class JwtTokenService(IConfiguration config) : IJwtTokenService
{
    public string GenerateToken(int employeeId, string fullName, string loginIdentifier,
        int? companyId, int? contractorId, string role)
    {
        var jwtConfig = config.GetSection("EmployeeJwt");
        var secret = jwtConfig["Secret"] ?? throw new InvalidOperationException("EmployeeJwt:Secret not configured.");
        var issuer = jwtConfig["Issuer"] ?? "monterio-api";
        var audience = jwtConfig["Audience"] ?? "monterio-employees";
        var expiryMin = int.TryParse(jwtConfig["ExpiryMinutes"], out var m) ? m : 480;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, employeeId.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Name, fullName),
            new("login", loginIdentifier),
            new("role", role),
            new(ClaimTypes.Role, role),
        };

        if (companyId.HasValue) claims.Add(new Claim("company_id", companyId.Value.ToString()));
        if (contractorId.HasValue) claims.Add(new Claim("contractor_id", contractorId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(expiryMin),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
