using Monterio.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Address> Addresses { get; }
    DbSet<Company> Companies { get; }
    DbSet<Location> Locations { get; }
    DbSet<ServiceGroup> ServiceGroups { get; }
    DbSet<Contractor> Contractors { get; }
    DbSet<Employee> Employees { get; }
    DbSet<ServiceGroupMember> ServiceGroupMembers { get; }
    DbSet<Customer> Customers { get; }
    DbSet<MeasurementAttribute> MeasurementAttributes { get; }
    DbSet<ServiceCatalogItem> ServiceCatalogItems { get; }
    DbSet<ServiceActivity> ServiceActivities { get; }
    DbSet<Request> Requests { get; }
    DbSet<RequestActivity> RequestActivities { get; }
    DbSet<RequestActivityTask> RequestActivityTasks { get; }
    DbSet<RequestAttachment> RequestAttachments { get; }
    DbSet<PrintTemplate> PrintTemplates { get; }
    DbSet<StorageProviderConfig> StorageProviderConfigs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
