using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>Firma wykonawcza (instalator) na umowie B2B — należy do jednej lub więcej grup
/// serwisowych, ma własnych pracowników.</summary>
public class Contractor : BaseEntity, ISoftDelete
{
    public string Name { get; private set; } = string.Empty;
    public string? TaxId { get; private set; }
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public int? AddressId { get; private set; }
    public bool IsActive { get; private set; } = true;

    public Address? Address { get; private set; }
    public ICollection<Employee> Employees { get; private set; } = [];
    public ICollection<ServiceGroupMember> ServiceGroupMemberships { get; private set; } = [];

    private Contractor() { }

    public static Contractor Create(string name, string? taxId = null, string? phone = null, string? email = null)
        => new() { Name = name, TaxId = taxId, Phone = phone, Email = email };

    public void Update(string name, string? taxId, string? phone, string? email, bool isActive)
    {
        Name = name;
        TaxId = taxId;
        Phone = phone;
        Email = email;
        IsActive = isActive;
        SetUpdatedAt();
    }

    public void SetAddress(int? addressId)
    {
        AddressId = addressId;
        SetUpdatedAt();
    }
}
