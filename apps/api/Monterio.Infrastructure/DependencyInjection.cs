using Monterio.Application.Common.Interfaces;
using Monterio.Infrastructure.Persistence;
using Monterio.Infrastructure.Services;
using Monterio.Infrastructure.SignalR;
using Monterio.Infrastructure.Storage;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Monterio.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        // Przechowywanie załączników: dysk lokalny (domyślnie) albo chmura wybrana w UI. Klucze Data
        // Protection (szyfrowanie sekretów chmury) MUSZĄ przeżyć restart/aktualizację — domyślnie leżą
        // obok załączników (backup załączników = backup kluczy), ścieżka nadpisywalna DataProtection:KeysPath.
        var keysPath = configuration["DataProtection:KeysPath"]
            ?? Path.Combine(configuration["Storage:Local:UploadPath"] ?? "uploads", ".keys");
        services.AddDataProtection()
            .SetApplicationName("Monterio")
            .PersistKeysToFileSystem(new DirectoryInfo(keysPath));
        services.AddSingleton<IStorageBackend, LocalStorageBackend>();
        services.AddSingleton<IStorageBackend, OneDriveStorageBackend>();
        services.AddSingleton<IStorageBackend, GoogleDriveStorageBackend>();
        services.AddSingleton<IStorageBackend, DropboxStorageBackend>();
        services.AddSingleton<IStorageBackend, S3StorageBackend>();
        services.AddScoped<StorageService>();
        services.AddScoped<IFileStorageService>(sp => sp.GetRequiredService<StorageService>());
        services.AddScoped<IStorageAdminService>(sp => sp.GetRequiredService<StorageService>());
        services.AddSingleton<IPdfRenderer, PuppeteerPdfRenderer>();
        services.AddSignalR();
        services.AddScoped<IRequestHubService, RequestHubService>();
        services.AddScoped<IRequestNumberGenerator, RequestNumberGenerator>();
        services.AddSingleton<IRatingTokenService, RatingTokenService>();

        services.AddScoped<AppDbContextSeeder>();

        return services;
    }
}
