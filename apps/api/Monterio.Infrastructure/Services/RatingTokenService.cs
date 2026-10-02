using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Monterio.Application.Common.Interfaces;

namespace Monterio.Infrastructure.Services;

public class RatingTokenService(IConfiguration configuration) : IRatingTokenService
{
    public string GenerateToken(int requestId)
    {
        var secret = configuration["RatingLink:Secret"]
            ?? throw new InvalidOperationException("Brak RatingLink:Secret w konfiguracji.");
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(requestId.ToString()));
        return Convert.ToHexString(hash)[..16].ToLowerInvariant();
    }

    public bool VerifyToken(int requestId, string? token) =>
        !string.IsNullOrEmpty(token) &&
        CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(GenerateToken(requestId)), Encoding.UTF8.GetBytes(token));
}
