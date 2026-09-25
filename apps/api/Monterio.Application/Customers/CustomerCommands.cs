using Monterio.Application.Common;
using Monterio.Application.Common.Dtos;
using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Customers;

public record CreateCustomerCommand(
    int CompanyId, string Name, int? LocationId = null,
    string? Phone = null, string? Email = null, AddressDto? Address = null) : IRequest<int>;

public class CreateCustomerCommandHandler(IApplicationDbContext db) : IRequestHandler<CreateCustomerCommand, int>
{
    public async Task<int> Handle(CreateCustomerCommand request, CancellationToken ct)
    {
        var customer = Customer.Create(request.CompanyId, request.Name, request.LocationId, request.Phone, request.Email);
        await db.Customers.AddAsync(customer, ct);
        await db.SaveChangesAsync(ct);

        if (request.Address is not null)
        {
            customer.SetAddress(await AddressHelper.UpsertAsync(db, null, request.Address, ct));
            await db.SaveChangesAsync(ct);
        }

        return customer.Id;
    }
}

public record UpdateCustomerCommand(
    int Id, string Name, string? Phone, string? Email, int? LocationId, bool IsActive,
    AddressDto? Address = null) : IRequest;

public class UpdateCustomerCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateCustomerCommand>
{
    public async Task Handle(UpdateCustomerCommand request, CancellationToken ct)
    {
        var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == request.Id, ct)
            ?? throw new InvalidOperationException($"Customer {request.Id} not found.");

        customer.Update(request.Name, request.Phone, request.Email, request.LocationId, request.IsActive);

        if (request.Address is not null)
            customer.SetAddress(await AddressHelper.UpsertAsync(db, customer.AddressId, request.Address, ct));

        await db.SaveChangesAsync(ct);
    }
}
