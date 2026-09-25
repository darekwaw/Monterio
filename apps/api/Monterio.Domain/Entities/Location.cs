using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>
/// Węzeł dowolnej struktury lokalizacji (np. Bel-Pol/Oddziały/Sklepy) — materialized path,
/// dowolna głębokość i kształt drzewa, tak jak w CMMS.
/// </summary>
public class Location : BaseEntity, ISoftDelete
{
    public int CompanyId { get; private set; }
    public int? ParentId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Path { get; private set; } = string.Empty;
    public int Level { get; private set; }
    public int? AddressId { get; private set; }
    public bool IsActive { get; private set; } = true;

    public Company Company { get; private set; } = null!;
    public Location? Parent { get; private set; }
    public Address? Address { get; private set; }
    public ICollection<Location> Children { get; private set; } = [];
    public ICollection<ServiceGroup> ServiceGroups { get; private set; } = [];

    private Location() { }

    public static Location Create(int companyId, string name, int? parentId, string path, int level)
        => new() { CompanyId = companyId, Name = name, ParentId = parentId, Path = path, Level = level };

    public void SetPath(string path) { Path = path; SetUpdatedAt(); }

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

    public void ChangeParent(int? newParentId, string newPath, int newLevel)
    {
        ParentId = newParentId;
        Path = newPath;
        Level = newLevel;
        SetUpdatedAt();
    }
}
