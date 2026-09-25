namespace Monterio.Domain.Enums;

/// <summary>
/// Stan zlecenia — celowo stały enum, nie konfigurowalny słownik jak w CMMS. Monterio ma mieć
/// prosty, przewidywalny cykl życia zlecenia; jeśli w praktyce okaże się za sztywny, to pierwsze
/// miejsce do rozbudowy.
/// </summary>
public enum RequestStatus
{
    Nowe = 1,
    Przypisane = 2,
    WTrakcie = 3,
    Wykonane = 4,
    Anulowane = 5,
}
