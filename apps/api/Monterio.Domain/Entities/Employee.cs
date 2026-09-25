using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>
/// Jedna tabela logowania dla obu ról: dyspozytor Bel-Pol (CompanyId ustawione, ContractorId puste,
/// loguje się przez web) i instalator firmy B2B (ContractorId ustawione, CompanyId puste, loguje
/// się PIN-em przez mobile). Dokładnie jedno z dwóch pól musi być ustawione — pilnuje tego handler
/// tworzący pracownika, nie baza.
/// </summary>
public class Employee : BaseEntity, ISoftDelete
{
    public int? CompanyId { get; private set; }
    public int? ContractorId { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string? Email { get; private set; }

    public string LoginIdentifier { get; private set; } = string.Empty;
    public string? PasswordHash { get; private set; }
    public string? PinHash { get; private set; }

    public bool IsActive { get; private set; } = true;

    public Company? Company { get; private set; }
    public Contractor? Contractor { get; private set; }

    private Employee() { }

    public static Employee Create(int? companyId, int? contractorId, string fullName,
        string loginIdentifier, string? phone = null, string? email = null)
        => new()
        {
            CompanyId = companyId,
            ContractorId = contractorId,
            FullName = fullName,
            LoginIdentifier = loginIdentifier.ToLowerInvariant(),
            Phone = phone,
            Email = email,
        };

    public void SetPassword(string hash) { PasswordHash = hash; SetUpdatedAt(); }
    public void SetPin(string hash) { PinHash = hash; SetUpdatedAt(); }

    public void Update(string fullName, string? phone, string? email, bool isActive)
    {
        FullName = fullName;
        Phone = phone;
        Email = email;
        IsActive = isActive;
        SetUpdatedAt();
    }
}
