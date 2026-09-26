using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Employees;

/// <summary>Dokładnie jedno z CompanyId/ContractorId musi być podane — dyspozytor Bel-Pol albo
/// instalator firmy B2B, nigdy oba naraz i nigdy żadne.</summary>
public record CreateEmployeeCommand(
    int? CompanyId, int? ContractorId, string FullName, string LoginIdentifier,
    string Password, string? Phone = null, string? Email = null) : IRequest<int>;

public class CreateEmployeeCommandHandler(IApplicationDbContext db, IPasswordHasher hasher)
    : IRequestHandler<CreateEmployeeCommand, int>
{
    public async Task<int> Handle(CreateEmployeeCommand request, CancellationToken ct)
    {
        if (request.CompanyId.HasValue == request.ContractorId.HasValue)
            throw new InvalidOperationException("Dokładnie jedno z CompanyId/ContractorId musi być ustawione.");

        var login = request.LoginIdentifier.Trim().ToLowerInvariant();
        if (await db.Employees.AnyAsync(e => e.LoginIdentifier == login, ct))
            throw new InvalidOperationException($"Login '{login}' jest już zajęty.");

        var employee = Employee.Create(request.CompanyId, request.ContractorId, request.FullName,
            login, request.Phone, request.Email);
        employee.SetPassword(hasher.Hash(request.Password));

        await db.Employees.AddAsync(employee, ct);
        await db.SaveChangesAsync(ct);
        return employee.Id;
    }
}

public record UpdateEmployeeCommand(
    int Id, string FullName, string? Phone, string? Email, bool IsActive) : IRequest;

public class UpdateEmployeeCommandHandler(IApplicationDbContext db) : IRequestHandler<UpdateEmployeeCommand>
{
    public async Task Handle(UpdateEmployeeCommand request, CancellationToken ct)
    {
        var employee = await db.Employees.FirstOrDefaultAsync(e => e.Id == request.Id, ct)
            ?? throw new InvalidOperationException($"Employee {request.Id} not found.");
        employee.Update(request.FullName, request.Phone, request.Email, request.IsActive);
        await db.SaveChangesAsync(ct);
    }
}

public record SetEmployeePasswordCommand(int Id, string NewPassword) : IRequest;

public class SetEmployeePasswordCommandHandler(IApplicationDbContext db, IPasswordHasher hasher)
    : IRequestHandler<SetEmployeePasswordCommand>
{
    public async Task Handle(SetEmployeePasswordCommand request, CancellationToken ct)
    {
        var employee = await db.Employees.FirstOrDefaultAsync(e => e.Id == request.Id, ct)
            ?? throw new InvalidOperationException($"Employee {request.Id} not found.");
        employee.SetPassword(hasher.Hash(request.NewPassword));
        await db.SaveChangesAsync(ct);
    }
}

/// <summary>PIN — logowanie w aplikacji mobilnej instalatora, ustawiane przez dyspozytora w
/// panelu Wykonawcy (instalator sam sobie PIN-u nie zakłada, przynajmniej nie w v1).</summary>
public record SetEmployeePinCommand(int Id, string NewPin) : IRequest;

public class SetEmployeePinCommandHandler(IApplicationDbContext db, IPasswordHasher hasher)
    : IRequestHandler<SetEmployeePinCommand>
{
    public async Task Handle(SetEmployeePinCommand request, CancellationToken ct)
    {
        if (request.NewPin.Length is < 4 or > 6 || !request.NewPin.All(char.IsDigit))
            throw new InvalidOperationException("PIN musi mieć 4-6 cyfr.");

        var employee = await db.Employees.FirstOrDefaultAsync(e => e.Id == request.Id, ct)
            ?? throw new InvalidOperationException($"Employee {request.Id} not found.");
        if (employee.ContractorId is null)
            throw new InvalidOperationException("PIN dotyczy tylko instalatorów (ContractorId ustawione).");

        employee.SetPin(hasher.Hash(request.NewPin));
        await db.SaveChangesAsync(ct);
    }
}
