namespace Monterio.Application.Common.Interfaces;

/// <summary>Powiadamia podłączonych klientów WWW (SignalR) o zmianie zlecenia — jedno zdarzenie
/// dla create/update/assign/status/pomiar/załącznik itd., bez rozbicia na wiele typów eventów.
/// Frontend po prostu invaliduje cache zleceń, niezależnie co dokładnie się zmieniło.</summary>
public interface IRequestHubService
{
    Task NotifyRequestChanged(int companyId, int requestId, CancellationToken ct);
}
