using Monterio.Application.Common.Interfaces;
using Monterio.Application.Requests.Commands;
using Monterio.Application.Requests.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Monterio.API.Controllers;

/// <summary>Publiczna, bezstanowa ścieżka do oceny zlecenia przez klienta — bez logowania.
/// Zabezpieczona tokenem (HMAC z RequestId, patrz IRatingTokenService), nie sesją/JWT
/// pracownika. Klient dostaje link/QR na ekranie instalatora po zamknięciu zlecenia.</summary>
[Tags("Ocena publiczna")]
[ApiController]
[Route("api/public/requests")]
public class PublicRatingController(ISender sender, IRatingTokenService tokenService) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, [FromQuery] string token, CancellationToken ct)
    {
        if (!tokenService.VerifyToken(id, token)) return NotFound();
        var info = await sender.Send(new GetPublicRatingInfoQuery(id), ct);
        return info is null ? NotFound() : Ok(info);
    }

    [HttpPut("{id:int}/rating")]
    public async Task<IActionResult> Rate(int id, [FromQuery] string token, [FromBody] PublicRatingRequest body, CancellationToken ct)
    {
        if (!tokenService.VerifyToken(id, token)) return NotFound();
        if (body.Rating is < 1 or > 5) return BadRequest();
        await sender.Send(new SetRequestRatingCommand(id, body.Rating, body.Comment), ct);
        return NoContent();
    }
}

public record PublicRatingRequest(int Rating, string? Comment);
