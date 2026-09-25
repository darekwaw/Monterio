using Monterio.Domain.Common;
using RequestStatusEnum = Monterio.Domain.Enums.RequestStatus;

namespace Monterio.Domain.Entities;

/// <summary>Zlecenie — klient + data wykonania + przypisanie + lista usług. Bez SLA, priorytetów,
/// kontraktów i jakichkolwiek kwot.</summary>
public class Request : BaseEntity, ISoftDelete
{
    public string Number { get; private set; } = string.Empty;
    public int CompanyId { get; private set; }
    public int CustomerId { get; private set; }
    public int? LocationId { get; private set; }
    public string? Description { get; private set; }
    public DateTime? ScheduledDate { get; private set; }
    public RequestStatusEnum Status { get; private set; } = RequestStatusEnum.Nowe;

    // Przypisanie — dokładnie jeden poziom wskazany naraz: grupa, ALBO firma w grupie,
    // ALBO konkretny pracownik firmy. Pilnuje tego AssignRequestCommand, nie baza.
    public int? ServiceGroupId { get; private set; }
    public int? ContractorId { get; private set; }
    public int? EmployeeId { get; private set; }

    public int CreatedByEmployeeId { get; private set; }

    public Company Company { get; private set; } = null!;
    public Customer Customer { get; private set; } = null!;
    public Location? Location { get; private set; }
    public ServiceGroup? ServiceGroup { get; private set; }
    public Contractor? Contractor { get; private set; }
    public Employee? Employee { get; private set; }
    public Employee CreatedByEmployee { get; private set; } = null!;

    public ICollection<RequestActivity> Activities { get; private set; } = [];
    public ICollection<RequestAttachment> Attachments { get; private set; } = [];

    private Request() { }

    public static Request Create(string number, int companyId, int customerId, int createdByEmployeeId,
        string? description = null, int? locationId = null, DateTime? scheduledDate = null)
        => new()
        {
            Number = number,
            CompanyId = companyId,
            CustomerId = customerId,
            CreatedByEmployeeId = createdByEmployeeId,
            Description = description,
            LocationId = locationId,
            ScheduledDate = scheduledDate,
        };

    public void Assign(int? serviceGroupId, int? contractorId, int? employeeId)
    {
        ServiceGroupId = serviceGroupId;
        ContractorId = contractorId;
        EmployeeId = employeeId;
        if (Status == RequestStatusEnum.Nowe) Status = RequestStatusEnum.Przypisane;
        SetUpdatedAt();
    }

    public void SetScheduledDate(DateTime? date) { ScheduledDate = date; SetUpdatedAt(); }

    public void ChangeStatus(RequestStatusEnum status) { Status = status; SetUpdatedAt(); }

    public void SetDescription(string? description) { Description = description; SetUpdatedAt(); }
}
