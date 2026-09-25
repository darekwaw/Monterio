using Monterio.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Employees;

public record GetEmployeesQuery(int? CompanyId = null, int? ContractorId = null, bool OnlyActive = false)
    : IRequest<List<EmployeeDto>>;

public record EmployeeDto(int Id, int? CompanyId, int? ContractorId, string FullName,
    string LoginIdentifier, string? Phone, string? Email, bool IsActive);

public class GetEmployeesQueryHandler(IApplicationDbContext db) : IRequestHandler<GetEmployeesQuery, List<EmployeeDto>>
{
    public async Task<List<EmployeeDto>> Handle(GetEmployeesQuery request, CancellationToken ct)
    {
        var query = db.Employees.AsQueryable();
        if (request.CompanyId.HasValue) query = query.Where(e => e.CompanyId == request.CompanyId.Value);
        if (request.ContractorId.HasValue) query = query.Where(e => e.ContractorId == request.ContractorId.Value);
        if (request.OnlyActive) query = query.Where(e => e.IsActive);

        var employees = await query.OrderBy(e => e.FullName).ToListAsync(ct);
        return employees.Select(e => new EmployeeDto(
            e.Id, e.CompanyId, e.ContractorId, e.FullName, e.LoginIdentifier, e.Phone, e.Email, e.IsActive)).ToList();
    }
}
