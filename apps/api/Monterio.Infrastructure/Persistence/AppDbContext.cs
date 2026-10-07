using System.Linq.Expressions;
using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Common;
using Monterio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Monterio.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUserService currentUser)
    : DbContext(options), IApplicationDbContext
{
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<ServiceGroup> ServiceGroups => Set<ServiceGroup>();
    public DbSet<Contractor> Contractors => Set<Contractor>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<ServiceGroupMember> ServiceGroupMembers => Set<ServiceGroupMember>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<MeasurementAttribute> MeasurementAttributes => Set<MeasurementAttribute>();
    public DbSet<ServiceCatalogItem> ServiceCatalogItems => Set<ServiceCatalogItem>();
    public DbSet<ServiceActivity> ServiceActivities => Set<ServiceActivity>();
    public DbSet<Request> Requests => Set<Request>();
    public DbSet<RequestActivity> RequestActivities => Set<RequestActivity>();
    public DbSet<RequestActivityTask> RequestActivityTasks => Set<RequestActivityTask>();
    public DbSet<RequestAttachment> RequestAttachments => Set<RequestAttachment>();
    public DbSet<PrintTemplate> PrintTemplates => Set<PrintTemplate>();
    public DbSet<StorageProviderConfig> StorageProviderConfigs => Set<StorageProviderConfig>();
    public DbSet<RequestNumberCounter> RequestNumberCounters => Set<RequestNumberCounter>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                continue;

            // Optimistic locking — rowversion na każdej encji domenowej
            modelBuilder.Entity(entityType.ClrType)
                .Property(nameof(BaseEntity.RowVersion))
                .IsRowVersion();

            // Soft-delete — globalny filtr ukrywający usunięte rekordy
            if (typeof(ISoftDelete).IsAssignableFrom(entityType.ClrType))
            {
                var param = Expression.Parameter(entityType.ClrType, "e");
                var body = Expression.Equal(
                    Expression.Property(param, nameof(BaseEntity.IsDeleted)),
                    Expression.Constant(false));
                modelBuilder.Entity(entityType.ClrType).HasQueryFilter(Expression.Lambda(body, param));
            }
        }

        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        var login = currentUser.LoginIdentifier;

        foreach (var entry in ChangeTracker.Entries<BaseEntity>().Where(e => e.State == EntityState.Deleted))
        {
            if (entry.Entity is not ISoftDelete softDelete) continue;
            entry.State = EntityState.Modified;
            softDelete.MarkDeleted(login);
        }

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.SetCreatedBy(login);
                entry.Entity.SetUpdatedBy(login);
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.SetUpdatedBy(login);
            }
        }

        return base.SaveChangesAsync(ct);
    }
}
