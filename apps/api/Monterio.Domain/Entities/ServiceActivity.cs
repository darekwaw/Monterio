using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>Czynność w ramach usługi katalogowej — np. "Szerokość" dla "Wymiarowanie drzwi".
/// Opcjonalne bezpośrednie powiązanie z punktem pomiarowym (FK wprost, bez matchowania po
/// kluczu jak w CMMS — Monterio nie ma Assetów, więc nie ma czego disambiguować).</summary>
public class ServiceActivity : BaseEntity
{
    public int ServiceCatalogItemId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int SortOrder { get; private set; }
    public int? MeasurementAttributeId { get; private set; }

    public ServiceCatalogItem ServiceCatalogItem { get; private set; } = null!;
    public MeasurementAttribute? MeasurementAttribute { get; private set; }

    private ServiceActivity() { }

    public static ServiceActivity Create(int serviceCatalogItemId, string name, int sortOrder = 0,
        int? measurementAttributeId = null)
        => new()
        {
            ServiceCatalogItemId = serviceCatalogItemId,
            Name = name,
            SortOrder = sortOrder,
            MeasurementAttributeId = measurementAttributeId
        };

    public void Update(string name, int sortOrder, int? measurementAttributeId)
    {
        Name = name;
        SortOrder = sortOrder;
        MeasurementAttributeId = measurementAttributeId;
        SetUpdatedAt();
    }
}
