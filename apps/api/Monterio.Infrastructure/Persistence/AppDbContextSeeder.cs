using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using Monterio.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Monterio.Infrastructure.Persistence;

public class AppDbContextSeeder(AppDbContext db, IPasswordHasher hasher, ILogger<AppDbContextSeeder> logger)
{
    public async Task SeedAsync()
    {
        try
        {
            var company = await SeedCompanyAsync();
            await SeedAdminAsync(company.Id);
            await SeedDemoDictionariesAsync();
            logger.LogInformation("Seed data applied successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error seeding database.");
            throw;
        }
    }

    private async Task<Company> SeedCompanyAsync()
    {
        var existing = await db.Companies.FirstOrDefaultAsync();
        if (existing is not null) return existing;

        var company = Company.Create("Bel-Pol");
        await db.Companies.AddAsync(company);
        await db.SaveChangesAsync();
        logger.LogInformation("Seeded default company '{Name}'.", company.Name);
        return company;
    }

    private async Task SeedAdminAsync(int companyId)
    {
        if (Environment.GetEnvironmentVariable("MONTERIO_SKIP_ADMIN_SEED") == "true") return;
        if (await db.Employees.AnyAsync(e => e.LoginIdentifier == "admin")) return;

        var admin = Employee.Create(companyId, null, "Administrator Systemu", "admin");
        admin.SetPassword(hasher.Hash("Admin123!"));
        await db.Employees.AddAsync(admin);
        await db.SaveChangesAsync();
        logger.LogInformation("Seeded default admin (login: admin, password: Admin123!) — ZMIEŃ HASŁO po pierwszym logowaniu!");
    }

    /// <summary>Punkty pomiarowe i pozycje katalogu z przykładów rozmowy z klientem — żeby
    /// formularz zlecenia od razu miał czym się wypełnić, nie startował pusty.</summary>
    private async Task SeedDemoDictionariesAsync()
    {
        if (await db.MeasurementAttributes.AnyAsync()) return;

        var wysokosc = MeasurementAttribute.Create("Wysokość", AttributeDataType.Decimal, "cm", 0, 300);
        var szerokosc = MeasurementAttribute.Create("Szerokość", AttributeDataType.Decimal, "cm", 0, 300);
        var kierunek = MeasurementAttribute.Create("Kierunek otwierania", AttributeDataType.Select,
            options: "[\"Lewe\",\"Prawe\"]");
        var powierzchnia = MeasurementAttribute.Create("Powierzchnia", AttributeDataType.Decimal, "m2", 0, 1000);
        var wilgotnosc = MeasurementAttribute.Create("Wilgotność", AttributeDataType.Decimal, "%", 0, 100);

        await db.MeasurementAttributes.AddRangeAsync(wysokosc, szerokosc, kierunek, powierzchnia, wilgotnosc);
        await db.SaveChangesAsync();

        var wymiarowanieDrzwi = ServiceCatalogItem.Create("Wymiarowanie drzwi");
        var montazDrzwi = ServiceCatalogItem.Create("Montaż drzwi");
        var wymiarowaniePodlogi = ServiceCatalogItem.Create("Wymiarowanie podłogi");
        var sprawdzenieWilgotnosci = ServiceCatalogItem.Create("Sprawdzenie wilgotności podłoża");

        await db.ServiceCatalogItems.AddRangeAsync(
            wymiarowanieDrzwi, montazDrzwi, wymiarowaniePodlogi, sprawdzenieWilgotnosci);
        await db.SaveChangesAsync();

        await db.ServiceActivities.AddRangeAsync(
            ServiceActivity.Create(wymiarowanieDrzwi.Id, "Wysokość", 1, wysokosc.Id),
            ServiceActivity.Create(wymiarowanieDrzwi.Id, "Szerokość", 2, szerokosc.Id),
            ServiceActivity.Create(wymiarowanieDrzwi.Id, "Kierunek otwierania", 3, kierunek.Id),

            ServiceActivity.Create(montazDrzwi.Id, "Montaż ościeżnicy", 1),
            ServiceActivity.Create(montazDrzwi.Id, "Montaż skrzydła", 2),
            ServiceActivity.Create(montazDrzwi.Id, "Regulacja i uszczelnienie", 3),

            ServiceActivity.Create(wymiarowaniePodlogi.Id, "Powierzchnia", 1, powierzchnia.Id),

            ServiceActivity.Create(sprawdzenieWilgotnosci.Id, "Wilgotność podłoża", 1, wilgotnosc.Id));

        await db.SaveChangesAsync();
        logger.LogInformation("Seeded demo dictionaries: measurement attributes + service catalog.");
    }
}
