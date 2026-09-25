using Monterio.Application.ServiceGroups;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Monterio.API.Controllers;

[Tags("Grupy serwisowe")]
[ApiController]
[Route("api/service-groups")]
[Authorize]
public class ServiceGroupsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? locationId, CancellationToken ct)
        => Ok(await sender.Send(new GetServiceGroupsQuery(locationId), ct));

    [HttpGet("{id:int}/members")]
    public async Task<IActionResult> GetMembers(int id, CancellationToken ct)
        => Ok(await sender.Send(new GetServiceGroupMembersQuery(id), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateServiceGroupCommand body, CancellationToken ct)
    {
        var id = await sender.Send(body, ct);
        return Ok(new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceGroupRequest body, CancellationToken ct)
    {
        await sender.Send(new UpdateServiceGroupCommand(id, body.Name, body.IsActive), ct);
        return NoContent();
    }

    [HttpPost("{id:int}/members/{contractorId:int}")]
    public async Task<IActionResult> AddMember(int id, int contractorId, CancellationToken ct)
    {
        await sender.Send(new AddContractorToGroupCommand(id, contractorId), ct);
        return NoContent();
    }

    [HttpDelete("{id:int}/members/{contractorId:int}")]
    public async Task<IActionResult> RemoveMember(int id, int contractorId, CancellationToken ct)
    {
        await sender.Send(new RemoveContractorFromGroupCommand(id, contractorId), ct);
        return NoContent();
    }
}

public record UpdateServiceGroupRequest(string Name, bool IsActive);
