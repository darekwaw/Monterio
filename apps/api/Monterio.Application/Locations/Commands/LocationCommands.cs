using Monterio.Application.Common;
using Monterio.Application.Common.Dtos;
using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Locations.Commands;

public record CreateLocationCommand(
    int CompanyId, string Name, int? ParentId, AddressDto? Address = null) : IRequest<int>;

public class CreateLocationCommandHandler(IApplicationDbContext db) : IRequestHandler<CreateLocationCommand, int>
{
    public async Task<int> Handle(CreateLocationCommand request, CancellationToken ct)
    {
        string path;
        int level;

        if (request.ParentId.HasValue)
        {
            var parent = await db.Locations.FirstOrDefaultAsync(
                l => l.Id == request.ParentId && l.CompanyId == request.CompanyId, ct)
                ?? throw new InvalidOperationException($"Parent location {request.ParentId} not found.");
            level = parent.Level + 1;
            path = parent.Path;
        }
        else
        {
            level = 0;
            path = string.Empty;
        }

        var location = Location.Create(request.CompanyId, request.Name, request.ParentId, path, level);
        await db.Locations.AddAsync(location, ct);
        await db.SaveChangesAsync(ct);

        location.SetPath(string.IsNullOrEmpty(path) ? location.Id.ToString() : $"{path}/{location.Id}");

        if (request.Address is not null)
            location.SetAddress(await AddressHelper.UpsertAsync(db, null, request.Address, ct));

        await db.SaveChangesAsync(ct);
        return location.Id;
    }
}

public record UpdateLocationCommand(int Id, string Name, bool IsActive, AddressDto? Address = null) : IRequest;

public class UpdateLocationCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateLocationCommand>
{
    public async Task Handle(UpdateLocationCommand request, CancellationToken ct)
    {
        var location = await db.Locations.FirstOrDefaultAsync(l => l.Id == request.Id, ct)
            ?? throw new InvalidOperationException($"Location {request.Id} not found.");

        location.Update(request.Name, request.IsActive);

        if (request.Address is not null)
            location.SetAddress(await AddressHelper.UpsertAsync(db, location.AddressId, request.Address, ct));

        await db.SaveChangesAsync(ct);
    }
}
