using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>Grupa serwisowa przypisana do lokalizacji — skupia firmy B2B (Contractor), które mogą
/// przyjmować zlecenia z tej lokalizacji.</summary>
public class ServiceGroup : BaseEntity, ISoftDelete
{
    public int LocationId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;

    public Location Location { get; private set; } = null!;
    public ICollection<ServiceGroupMember> Members { get; private set; } = [];

    private ServiceGroup() { }

    public static ServiceGroup Create(int locationId, string name)
        => new() { LocationId = locationId, Name = name };

    public void Update(string name, bool isActive)
    {
        Name = name;
        IsActive = isActive;
        SetUpdatedAt();
    }
}
