using Microsoft.EntityFrameworkCore;
using Monterio.Application.Common.Interfaces;
using Monterio.Infrastructure.Persistence;

namespace Monterio.Infrastructure.Services;

/// <summary>Atomowy licznik numeracji zleceń — jeden MERGE...OUTPUT zamiast COUNT(*)+1, więc:
/// (1) brak wyścigu przy równoczesnym tworzeniu (SQL Server serializuje aktualizacje tego samego
/// wiersza RequestNumberCounters, WITH (HOLDLOCK) usuwa znaną lukę wyścigu w samym MERGE),
/// (2) O(1) zamiast rosnącego z czasem skanu tabeli Requests.</summary>
public class RequestNumberGenerator(AppDbContext db) : IRequestNumberGenerator
{
    public async Task<string> NextNumberAsync(int companyId, CancellationToken ct)
    {
        var year = DateTime.UtcNow.Year;

        var result = await db.Database.SqlQuery<int>($"""
            MERGE RequestNumberCounters WITH (HOLDLOCK) AS target
            USING (SELECT {companyId} AS CompanyId, {year} AS Year) AS src
            ON target.CompanyId = src.CompanyId AND target.Year = src.Year
            WHEN MATCHED THEN UPDATE SET LastNumber = target.LastNumber + 1
            WHEN NOT MATCHED THEN INSERT (CompanyId, Year, LastNumber) VALUES (src.CompanyId, src.Year, 1)
            OUTPUT inserted.LastNumber AS Value;
            """).ToListAsync(ct);

        return $"ZL/{year}/{result[0]:D4}";
    }
}
