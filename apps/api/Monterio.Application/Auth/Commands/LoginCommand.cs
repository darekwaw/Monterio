using Monterio.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Auth.Commands;

public record LoginCommand(string LoginIdentifier, string Password) : IRequest<LoginResult>;

public record LoginResult(
    bool Success,
    string? Error,
    string? Token,
    int ExpiresInMinutes,
    int? EmployeeId,
    string? FullName,
    string? Role,
    int? CompanyId,
    int? ContractorId);

public class LoginCommandHandler(IApplicationDbContext db, IPasswordHasher hasher, IJwtTokenService jwt)
    : IRequestHandler<LoginCommand, LoginResult>
{
    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken ct)
    {
        var login = request.LoginIdentifier.Trim().ToLowerInvariant();
        var employee = await db.Employees
            .FirstOrDefaultAsync(e => e.LoginIdentifier == login && e.IsActive && !e.IsDeleted, ct);

        if (employee is null || employee.PasswordHash is null || !hasher.Verify(request.Password, employee.PasswordHash))
            return new LoginResult(false, "Nieprawidłowy login lub hasło.", null, 0, null, null, null, null, null);

        var role = employee.ContractorId.HasValue ? "Installer" : "Dispatcher";
        var token = jwt.GenerateToken(employee.Id, employee.FullName, employee.LoginIdentifier,
            employee.CompanyId, employee.ContractorId, role);

        return new LoginResult(true, null, token, 480, employee.Id, employee.FullName, role,
            employee.CompanyId, employee.ContractorId);
    }
}

/// <summary>Logowanie PIN-em — tylko instalatorzy (mobile). PIN ustawia dyspozytor z poziomu web
/// (Wykonawcy → instalator → "Ustaw PIN"), instalator się nim tylko loguje.</summary>
public record LoginByPinCommand(string LoginIdentifier, string Pin) : IRequest<LoginResult>;

public class LoginByPinCommandHandler(IApplicationDbContext db, IPasswordHasher hasher, IJwtTokenService jwt)
    : IRequestHandler<LoginByPinCommand, LoginResult>
{
    public async Task<LoginResult> Handle(LoginByPinCommand request, CancellationToken ct)
    {
        var login = request.LoginIdentifier.Trim().ToLowerInvariant();
        var employee = await db.Employees
            .FirstOrDefaultAsync(e => e.LoginIdentifier == login && e.IsActive && !e.IsDeleted, ct);

        if (employee is null || employee.ContractorId is null || employee.PinHash is null
            || !hasher.Verify(request.Pin, employee.PinHash))
            return new LoginResult(false, "Nieprawidłowy login lub PIN.", null, 0, null, null, null, null, null);

        var token = jwt.GenerateToken(employee.Id, employee.FullName, employee.LoginIdentifier,
            employee.CompanyId, employee.ContractorId, "Installer");

        return new LoginResult(true, null, token, 480, employee.Id, employee.FullName, "Installer",
            employee.CompanyId, employee.ContractorId);
    }
}
