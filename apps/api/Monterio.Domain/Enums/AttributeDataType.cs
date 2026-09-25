namespace Monterio.Domain.Enums;

/// <summary>Typ danych punktu pomiarowego (np. Szerokość=Decimal, Kierunek otwierania=Select).</summary>
public enum AttributeDataType
{
    Decimal = 1,   // liczba zmiennoprzecinkowa, opcjonalnie z zakresem Min/Max
    Text    = 2,
    Boolean = 3,
    Date    = 4,
    Select  = 5,   // wybór z listy opcji (JSON array w Options)
}
