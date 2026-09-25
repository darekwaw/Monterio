namespace Monterio.Application.Common.Dtos;

public record AddressDto(
    int Id,
    string? Street,
    string? PostalCode,
    string? City,
    string? Country,
    decimal? Latitude,
    decimal? Longitude);
