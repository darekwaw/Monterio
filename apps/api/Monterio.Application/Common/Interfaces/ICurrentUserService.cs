namespace Monterio.Application.Common.Interfaces;

public interface ICurrentUserService
{
    int? EmployeeId { get; }
    string? LoginIdentifier { get; }
    string? FullName { get; }
    int? CompanyId { get; }
    int? ContractorId { get; }
    bool IsInRole(string role);
}
