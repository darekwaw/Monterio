using System.Security.Cryptography;
using Monterio.Application.Common.Interfaces;

namespace Monterio.Infrastructure.Services;

/// <summary>
/// PBKDF2-SHA256 z losową 16-bajtową solą i 100 000 iteracjami.
/// Format przechowywanego hasha: "v1:{base64(salt)}:{base64(hash)}"
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 100_000;
    private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

    public string Hash(string plainText)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(plainText, salt, Iterations, Algorithm, HashSize);
        return $"v1:{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }

    public bool Verify(string plainText, string storedHash)
    {
        var parts = storedHash.Split(':');
        if (parts.Length != 3 || parts[0] != "v1") return false;

        var salt = Convert.FromBase64String(parts[1]);
        var expectedHash = Convert.FromBase64String(parts[2]);
        var actualHash = Rfc2898DeriveBytes.Pbkdf2(plainText, salt, Iterations, Algorithm, HashSize);

        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }
}
