namespace Monterio.Domain.Entities;

/// <summary>Licznik numeracji zleceń per firma+rok (klucz: CompanyId+Year). Świadomie NIE BaseEntity —
/// jedyna operacja na tej tabeli to atomowy MERGE...OUTPUT surowym SQL (IRequestNumberGenerator),
/// nie zwykły EF change-tracking, więc RowVersion/soft-delete nie mają tu zastosowania.</summary>
public class RequestNumberCounter
{
    public int CompanyId { get; private set; }
    public int Year { get; private set; }
    public int LastNumber { get; private set; }

    private RequestNumberCounter() { }
}
