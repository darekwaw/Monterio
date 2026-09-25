using Monterio.Application.Common;
using Monterio.Application.Common.Dtos;
using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Contractors;

public record CreateContractorCommand(
    string Name, string? TaxId, string? Phone, string? Email, AddressDto? Address = null) : IRequest<int>;

public class CreateContractorCommandHandler(IApplicationDbContext db) : IRequestHandler<CreateContractorCommand, int>
{
    public async Task<int> Handle(CreateContractorCommand request, CancellationToken ct)
    {
        var contractor = Contractor.Create(request.Name, request.TaxId, request.Phone, request.Email);
        await db.Contractors.AddAsync(contractor, ct);
        await db.SaveChangesAsync(ct);

        if (request.Address is not null)
        {
            contractor.SetAddress(await AddressHelper.UpsertAsync(db, null, request.Address, ct));
            await db.SaveChangesAsync(ct);
        }

        return contractor.Id;
    }
}

public record UpdateContractorCommand(
    int Id, string Name, string? TaxId, string? Phone, string? Email, bool IsActive, AddressDto? Address = null) : IRequest;

public class UpdateContractorCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateContractorCommand>
{
    public async Task Handle(UpdateContractorCommand request, CancellationToken ct)
    {
        var contractor = await db.Contractors.FirstOrDefaultAsync(c => c.Id == request.Id, ct)
            ?? throw new InvalidOperationException($"Contractor {request.Id} not found.");

        contractor.Update(request.Name, request.TaxId, request.Phone, request.Email, request.IsActive);

        if (request.Address is not null)
            contractor.SetAddress(await AddressHelper.UpsertAsync(db, contractor.AddressId, request.Address, ct));

        await db.SaveChangesAsync(ct);
    }
}
