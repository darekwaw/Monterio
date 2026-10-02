namespace Monterio.Application.Common.Interfaces;

/// <summary>Token do publicznego linku/QR-kodu oceny zlecenia (bez logowania klienta) — patrz
/// PublicRatingController. Deterministyczny hash zamiast osobnej kolumny w bazie: nic do
/// migrowania, token zawsze da się odtworzyć z RequestId + sekretu.</summary>
public interface IRatingTokenService
{
    string GenerateToken(int requestId);
    bool VerifyToken(int requestId, string? token);
}
