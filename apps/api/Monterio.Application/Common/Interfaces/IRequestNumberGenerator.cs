namespace Monterio.Application.Common.Interfaces;

/// <summary>Generuje kolejny numer zlecenia (ZL/{rok}/{numer}) atomowo na poziomie bazy danych —
/// bez ryzyka wyścigu przy równoczesnym tworzeniu wielu zleceń naraz (patrz RequestNumberGenerator).</summary>
public interface IRequestNumberGenerator
{
    Task<string> NextNumberAsync(int companyId, CancellationToken ct);
}
