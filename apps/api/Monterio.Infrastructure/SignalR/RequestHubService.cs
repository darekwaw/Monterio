using Microsoft.AspNetCore.SignalR;
using Monterio.Application.Common.Interfaces;

namespace Monterio.Infrastructure.SignalR;

public class RequestHubService(IHubContext<MonterioHub> hub) : IRequestHubService
{
    public Task NotifyRequestChanged(int companyId, int requestId, CancellationToken ct)
        => hub.Clients.Group($"company_{companyId}").SendAsync("RequestsChanged", new { requestId }, ct);
}
