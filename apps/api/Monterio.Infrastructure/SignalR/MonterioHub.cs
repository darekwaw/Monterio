using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Monterio.Infrastructure.SignalR;

/// <summary>Jeden hub, jedna grupa per Company — Monterio jest single-tenant (jeden Company na
/// wdrożenie), więc nie ma potrzeby bardziej granularnego grupowania jak w CMMS.</summary>
[Authorize]
public class MonterioHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var companyId = Context.User?.FindFirst("company_id")?.Value;
        if (!string.IsNullOrEmpty(companyId))
            await Groups.AddToGroupAsync(Context.ConnectionId, $"company_{companyId}");

        await base.OnConnectedAsync();
    }
}
