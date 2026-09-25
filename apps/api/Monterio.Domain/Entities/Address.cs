using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>Uniwersalny adres — podpinany przez nullable FK z dowolnej strony (Company, Location,
/// Contractor, Customer). Wszystkie cztery MUSZĄ mieć AddressId (decyzja 2026-09-25).</summary>
public class Address : BaseEntity
{
    public string? Street { get; private set; }
    public string? PostalCode { get; private set; }
    public string? City { get; private set; }
    public string? Country { get; private set; }
    public decimal? Latitude { get; private set; }
    public decimal? Longitude { get; private set; }

    private Address() { }

    public static Address Create(string? street, string? postalCode, string? city, string? country,
        decimal? latitude = null, decimal? longitude = null)
        => new()
        {
            Street = street,
            PostalCode = postalCode,
            City = city,
            Country = country,
            Latitude = latitude,
            Longitude = longitude
        };

    public void Update(string? street, string? postalCode, string? city, string? country,
        decimal? latitude, decimal? longitude)
    {
        Street = street;
        PostalCode = postalCode;
        City = city;
        Country = country;
        Latitude = latitude;
        Longitude = longitude;
        SetUpdatedAt();
    }
}
