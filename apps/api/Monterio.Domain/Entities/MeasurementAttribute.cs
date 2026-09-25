using Monterio.Domain.Common;
using Monterio.Domain.Enums;

namespace Monterio.Domain.Entities;

/// <summary>
/// Słownik punktów pomiarowych — np. Szerokość/Wysokość/Kierunek otwierania dla drzwi, Powierzchnia
/// dla podłogi, Wilgotność dla podłoża. Płaski (bez podziału typ/instancja jak w CMMS) — spięty
/// z ServiceActivity wprost przez FK, nie przez MeasurementKey-matching w locie.
/// </summary>
public class MeasurementAttribute : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public AttributeDataType DataType { get; private set; }
    public string? Unit { get; private set; }
    public decimal? MinValue { get; private set; }
    public decimal? MaxValue { get; private set; }
    public string? Options { get; private set; }   // tylko Select — JSON: ["Lewe","Prawe"]
    public bool IsActive { get; private set; } = true;

    private MeasurementAttribute() { }

    public static MeasurementAttribute Create(string name, AttributeDataType dataType, string? unit = null,
        decimal? minValue = null, decimal? maxValue = null, string? options = null)
        => new() { Name = name, DataType = dataType, Unit = unit, MinValue = minValue, MaxValue = maxValue, Options = options };

    public void Update(string name, AttributeDataType dataType, string? unit, decimal? minValue,
        decimal? maxValue, string? options, bool isActive)
    {
        Name = name;
        DataType = dataType;
        Unit = unit;
        MinValue = minValue;
        MaxValue = maxValue;
        Options = options;
        IsActive = isActive;
        SetUpdatedAt();
    }
}
