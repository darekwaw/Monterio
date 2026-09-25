namespace Monterio.Application.Common.Interfaces;

public interface IJwtTokenService
{
    /// <summary>Jeden token dla obu ról — "Dispatcher" (CompanyId ustawione) albo "Installer"
    /// (ContractorId ustawione). Rozróżnienie w RBAC idzie po claimie "role", nie po osobnym
    /// typie tokenu jak w CMMS (tam web/mobile miały osobne generatory bez wyraźnego powodu).</summary>
    string GenerateToken(int employeeId, string fullName, string loginIdentifier,
        int? companyId, int? contractorId, string role);
}
