using Monterio.Application.Common.Dtos;
using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Common;

/// <summary>Wspólna logika przypisania uniwersalnego Address do właściciela (Company/Location/
/// Contractor/Customer — wszystkie cztery muszą mieć AddressId).</summary>
public static class AddressHelper
{
    public static async Task<int?> UpsertAsync(
        IApplicationDbContext db, int? currentAddressId, AddressDto? dto, CancellationToken ct)
    {
        if (dto is null) return null;

        if (currentAddressId.HasValue)
        {
            var existing = await db.Addresses.FirstOrDefaultAsync(a => a.Id == currentAddressId.Value, ct);
            if (existing is not null)
            {
                existing.Update(dto.Street, dto.PostalCode, dto.City, dto.Country, dto.Latitude, dto.Longitude);
                return currentAddressId;
            }
        }

        var address = Address.Create(dto.Street, dto.PostalCode, dto.City, dto.Country, dto.Latitude, dto.Longitude);
        await db.Addresses.AddAsync(address, ct);
        await db.SaveChangesAsync(ct);
        return address.Id;
    }

    public static AddressDto? ToDto(Address? address) =>
        address is null
            ? null
            : new AddressDto(address.Id, address.Street, address.PostalCode, address.City,
                address.Country, address.Latitude, address.Longitude);
}
