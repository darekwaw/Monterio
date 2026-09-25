using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>Klient indywidualny Bel-Pol — prosty, płaski byt zakładany inline przy zleceniu.</summary>
public class Customer : BaseEntity, ISoftDelete
{
    public int CompanyId { get; private set; }
    public int? LocationId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public int? AddressId { get; private set; }
    public bool IsActive { get; private set; } = true;

    public Company Company { get; private set; } = null!;
    public Location? Location { get; private set; }
    public Address? Address { get; private set; }
    public ICollection<Request> Requests { get; private set; } = [];

    private Customer() { }

    public static Customer Create(int companyId, string name, int? locationId = null,
        string? phone = null, string? email = null)
        => new() { CompanyId = companyId, Name = name, LocationId = locationId, Phone = phone, Email = email };

    public void Update(string name, string? phone, string? email, int? locationId, bool isActive)
    {
        Name = name;
        Phone = phone;
        Email = email;
        LocationId = locationId;
        IsActive = isActive;
        SetUpdatedAt();
    }

    public void SetAddress(int? addressId)
    {
        AddressId = addressId;
        SetUpdatedAt();
    }
}
