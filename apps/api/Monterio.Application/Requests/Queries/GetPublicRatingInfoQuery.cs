using MediatR;
using Microsoft.EntityFrameworkCore;
using Monterio.Application.Common.Interfaces;

namespace Monterio.Application.Requests.Queries;

/// <summary>Minimalny, publiczny widok zlecenia do strony oceny (bez logowania) — celowo BEZ
/// danych klienta/adresu/czynności, żeby link/QR nie ujawniał niczego wrażliwego poza samym
/// numerem zlecenia.</summary>
public record GetPublicRatingInfoQuery(int RequestId) : IRequest<PublicRatingInfoDto?>;

public record PublicRatingInfoDto(string Number, int? Rating, string? RatingComment);

public class GetPublicRatingInfoQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetPublicRatingInfoQuery, PublicRatingInfoDto?>
{
    public async Task<PublicRatingInfoDto?> Handle(GetPublicRatingInfoQuery request, CancellationToken ct)
    {
        var r = await db.Requests.AsNoTracking()
            .Where(x => x.Id == request.RequestId)
            .Select(x => new { x.Number, x.Rating, x.RatingComment })
            .FirstOrDefaultAsync(ct);
        return r is null ? null : new PublicRatingInfoDto(r.Number, r.Rating, r.RatingComment);
    }
}
