using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>
/// Minimalny koncept firmy — jeden rekord na wdrożenie (np. Bel-Pol), nie pełne drzewo
/// korporacyjne jak w CMMS. Zostaje jako punkt zaczepienia na wypadek, gdyby Monterio miał
/// kiedyś obsłużyć drugiego klienta z innym drzewem lokalizacji.
/// </summary>
public class Company : BaseEntity, ISoftDelete
{
    public string Name { get; private set; } = string.Empty;
    public int? AddressId { get; private set; }
    public bool IsActive { get; private set; } = true;

    public Address? Address { get; private set; }
    public ICollection<Location> Locations { get; private set; } = [];

    private Company() { }

    public static Company Create(string name) => new() { Name = name };

    public void Update(string name, bool isActive)
    {
        Name = name;
        IsActive = isActive;
        SetUpdatedAt();
    }

    public void SetAddress(int? addressId)
    {
        AddressId = addressId;
        SetUpdatedAt();
    }
}
