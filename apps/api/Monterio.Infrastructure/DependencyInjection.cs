using Monterio.Application.Common.Interfaces;
using Monterio.Infrastructure.Persistence;
using Monterio.Infrastructure.Services;
using Monterio.Infrastructure.SignalR;
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
        services.AddSingleton<IFileStorageService, LocalFileStorageService>();
        services.AddSingleton<IPdfRenderer, PuppeteerPdfRenderer>();
        services.AddSignalR();
        services.AddScoped<IRequestHubService, RequestHubService>();
        services.AddScoped<IRequestNumberGenerator, RequestNumberGenerator>();

        services.AddScoped<AppDbContextSeeder>();

        return services;
    }
}
