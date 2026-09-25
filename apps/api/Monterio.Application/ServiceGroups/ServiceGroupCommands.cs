using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.ServiceGroups;

public record CreateServiceGroupCommand(int LocationId, string Name) : IRequest<int>;

public class CreateServiceGroupCommandHandler(IApplicationDbContext db) : IRequestHandler<CreateServiceGroupCommand, int>
{
    public async Task<int> Handle(CreateServiceGroupCommand request, CancellationToken ct)
    {
        var group = ServiceGroup.Create(request.LocationId, request.Name);
        await db.ServiceGroups.AddAsync(group, ct);
        await db.SaveChangesAsync(ct);
        return group.Id;
    }
}

public record UpdateServiceGroupCommand(int Id, string Name, bool IsActive) : IRequest;

public class UpdateServiceGroupCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateServiceGroupCommand>
{
    public async Task Handle(UpdateServiceGroupCommand request, CancellationToken ct)
    {
        var group = await db.ServiceGroups.FirstOrDefaultAsync(g => g.Id == request.Id, ct)
            ?? throw new InvalidOperationException($"ServiceGroup {request.Id} not found.");
        group.Update(request.Name, request.IsActive);
        await db.SaveChangesAsync(ct);
    }
}

public record AddContractorToGroupCommand(int ServiceGroupId, int ContractorId) : IRequest;

public class AddContractorToGroupCommandHandler(IApplicationDbContext db) : IRequestHandler<AddContractorToGroupCommand>
{
    public async Task Handle(AddContractorToGroupCommand request, CancellationToken ct)
    {
        var exists = await db.ServiceGroupMembers.AnyAsync(
            m => m.ServiceGroupId == request.ServiceGroupId && m.ContractorId == request.ContractorId, ct);
        if (exists) return;

        await db.ServiceGroupMembers.AddAsync(
            ServiceGroupMember.Create(request.ServiceGroupId, request.ContractorId), ct);
        await db.SaveChangesAsync(ct);
    }
}

public record RemoveContractorFromGroupCommand(int ServiceGroupId, int ContractorId) : IRequest;

public class RemoveContractorFromGroupCommandHandler(IApplicationDbContext db) : IRequestHandler<RemoveContractorFromGroupCommand>
{
    public async Task Handle(RemoveContractorFromGroupCommand request, CancellationToken ct)
    {
        var member = await db.ServiceGroupMembers.FirstOrDefaultAsync(
            m => m.ServiceGroupId == request.ServiceGroupId && m.ContractorId == request.ContractorId, ct);
        if (member is null) return;
        db.ServiceGroupMembers.Remove(member);
        await db.SaveChangesAsync(ct);
    }
}
