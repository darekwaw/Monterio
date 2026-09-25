using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>Powiązanie grupa serwisowa ↔ firma wykonawcza.</summary>
public class ServiceGroupMember : BaseEntity
{
    public int ServiceGroupId { get; private set; }
    public int ContractorId { get; private set; }

    public ServiceGroup ServiceGroup { get; private set; } = null!;
    public Contractor Contractor { get; private set; } = null!;

    private ServiceGroupMember() { }

    public static ServiceGroupMember Create(int serviceGroupId, int contractorId)
        => new() { ServiceGroupId = serviceGroupId, ContractorId = contractorId };
}
