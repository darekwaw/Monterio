using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>Pozycja katalogu usług — np. "Wymiarowanie drzwi", "Montaż podłogi". Bez cen: Monterio
/// nie rozlicza, tylko dokumentuje wykonanie.</summary>
public class ServiceCatalogItem : BaseEntity, ISoftDelete
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; } = true;

    public ICollection<ServiceActivity> Activities { get; private set; } = [];

    private ServiceCatalogItem() { }

    public static ServiceCatalogItem Create(string name, string? description = null)
        => new() { Name = name, Description = description };

    public void Update(string name, string? description, bool isActive)
    {
        Name = name;
        Description = description;
        IsActive = isActive;
        SetUpdatedAt();
    }
}
