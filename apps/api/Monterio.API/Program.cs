using System.Text;
using Monterio.API.Auth;
using Monterio.Application;
using Monterio.Infrastructure;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Auth — DevAuth (dev, bez tokenu) | Employee JWT (HS256)
var useDevAuth = builder.Environment.IsDevelopment()
    && builder.Configuration.GetValue<bool>("UseDevAuth", true);

if (useDevAuth)
{
    builder.Services.AddAuthentication(DevAuthHandler.SchemeName)
        .AddScheme<AuthenticationSchemeOptions, DevAuthHandler>(DevAuthHandler.SchemeName, _ => { });
}
else
{
    var jwtCfg = builder.Configuration.GetSection("EmployeeJwt");
    var secret = jwtCfg["Secret"] ?? throw new InvalidOperationException("EmployeeJwt:Secret not configured.");
    var issuer = jwtCfg["Issuer"] ?? "monterio-api";
    var audience = jwtCfg["Audience"] ?? "monterio-employees";

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.MapInboundClaims = false;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(5),
                NameClaimType = "sub",
                RoleClaimType = "role",
            };
        });
}
builder.Services.AddAuthorization();

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 52_428_800; // 50 MB — załączniki do zlecenia
});

builder.Services.AddControllers();

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, ct) =>
    {
        document.Info = new OpenApiInfo
        {
            Title = "Monterio API",
            Version = "v1",
            Description =
                "REST API systemu Monterio — dedykowana aplikacja FSM dla dystrybutorów drzwi/podłóg.\n\n" +
                "## Architektura\n" +
                "- **Clean Architecture** — Domain / Application (CQRS + MediatR) / Infrastructure / API\n" +
                "- **Baza danych**: MS SQL Server, EF Core 10, migracje uruchamiane automatycznie przy starcie\n" +
                "- **Autentykacja**: JWT HS256, jeden token dla dyspozytora (web) i instalatora (mobile)\n\n" +
                "## Kody odpowiedzi\n" +
                "- **200** OK, **201** Created, **204** No Content\n" +
                "- **400** Bad Request, **401** Unauthorized, **403** Forbidden\n" +
                "- **404** Not Found, **409** Conflict (RowVersion), **422** reguła biznesowa, **500** błąd serwera"
        };
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes = new Dictionary<string, IOpenApiSecurityScheme>
        {
            ["Bearer"] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "Token JWT uzyskany z `POST /api/auth/login`."
            }
        };
        return Task.CompletedTask;
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("MonterioPolicy", policy =>
        policy
            .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
                ?? ["http://localhost:3010", "http://localhost:3000"])
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

if (!app.Environment.IsProduction())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.Title = "Monterio API";
        options.Theme = ScalarTheme.Purple;
        options.DefaultHttpClient = new(ScalarTarget.CSharp, ScalarClient.HttpClient);
    });
}

app.UseMiddleware<Monterio.API.Middleware.ExceptionHandlingMiddleware>();
app.UseCors("MonterioPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<Monterio.Infrastructure.Persistence.AppDbContext>();
    await db.Database.MigrateAsync();

    var seeder = scope.ServiceProvider.GetRequiredService<Monterio.Infrastructure.Persistence.AppDbContextSeeder>();
    await seeder.SeedAsync();
}

if (Environment.GetEnvironmentVariable("MONTERIO_MIGRATE_ONLY") == "true")
    return;

app.Run();
