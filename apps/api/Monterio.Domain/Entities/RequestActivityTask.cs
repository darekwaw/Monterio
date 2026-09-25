using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>Pojedyncza czynność w ramach usługi zlecenia. Gdy powiązana z punktem pomiarowym
/// (MeasurementAttributeId), realizacja zapisuje wartość zamiast zwykłego checkboxa.</summary>
public class RequestActivityTask : BaseEntity
{
    public int RequestActivityId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public int SortOrder { get; private set; }
    public bool IsDone { get; private set; }

    public int? MeasurementAttributeId { get; private set; }
    public decimal? MeasuredValueDecimal { get; private set; }
    public string? MeasuredValueText { get; private set; }
    public bool? MeasuredValueBoolean { get; private set; }
    public DateTime? MeasuredValueDate { get; private set; }
    public DateTime? MeasuredAt { get; private set; }
    public string? MeasuredBy { get; private set; }

    public RequestActivity Activity { get; private set; } = null!;
    public MeasurementAttribute? MeasurementAttribute { get; private set; }

    private RequestActivityTask() { }

    public static RequestActivityTask Create(int activityId, string description, int sortOrder = 0,
        int? measurementAttributeId = null)
        => new()
        {
            RequestActivityId = activityId,
            Description = description,
            SortOrder = sortOrder,
            MeasurementAttributeId = measurementAttributeId
        };

    public void ToggleDone() { IsDone = !IsDone; SetUpdatedAt(); }

    public void RecordMeasurement(decimal? valueDecimal, string? valueText, bool? valueBoolean,
        DateTime? valueDate, string? measuredBy)
    {
        MeasuredValueDecimal = valueDecimal;
        MeasuredValueText = valueText;
        MeasuredValueBoolean = valueBoolean;
        MeasuredValueDate = valueDate;
        MeasuredAt = DateTime.UtcNow;
        MeasuredBy = measuredBy;
        IsDone = true;
        SetUpdatedAt();
    }
}
