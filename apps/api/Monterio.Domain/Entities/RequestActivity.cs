using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>Usługa dodana do zlecenia — kopia z katalogu (copy-on-assignment: nazwa i czynności
/// kopiowane w momencie dodania, żeby późniejsza edycja katalogu nie zmieniała historii już
/// wykonanych zleceń). Bez ceny.</summary>
public class RequestActivity : BaseEntity
{
    public int RequestId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public bool IsFinished { get; private set; }

    public Request Request { get; private set; } = null!;
    public ICollection<RequestActivityTask> Tasks { get; private set; } = [];

    private RequestActivity() { }

    public static RequestActivity CreateCopy(int requestId, string name)
        => new() { RequestId = requestId, Name = name };

    public void MarkFinished() { IsFinished = true; SetUpdatedAt(); }
}
