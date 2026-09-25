using Monterio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Monterio.Infrastructure.Persistence.Configurations;

public class AddressConfiguration : IEntityTypeConfiguration<Address>
{
    public void Configure(EntityTypeBuilder<Address> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Street).HasMaxLength(300);
        builder.Property(a => a.PostalCode).HasMaxLength(20);
        builder.Property(a => a.City).HasMaxLength(200);
        builder.Property(a => a.Country).HasMaxLength(100);
        builder.Property(a => a.Latitude).HasPrecision(9, 6);
        builder.Property(a => a.Longitude).HasPrecision(9, 6);
    }
}

public class CompanyConfiguration : IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).IsRequired().HasMaxLength(300);
        builder.HasOne(c => c.Address).WithMany().HasForeignKey(c => c.AddressId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class LocationConfiguration : IEntityTypeConfiguration<Location>
{
    public void Configure(EntityTypeBuilder<Location> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Name).IsRequired().HasMaxLength(300);
        builder.Property(l => l.Path).IsRequired().HasMaxLength(2000);
        builder.HasIndex(l => l.Path);
        builder.HasIndex(l => new { l.CompanyId, l.IsActive }).HasFilter("[IsDeleted] = 0");

        builder.HasOne(l => l.Company).WithMany(c => c.Locations).HasForeignKey(l => l.CompanyId)
            .OnDelete(DeleteBehavior.NoAction);
        // Self-referencing — SQL Server odrzuca cascade na FK do tej samej tabeli.
        builder.HasOne(l => l.Parent).WithMany(l => l.Children).HasForeignKey(l => l.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(l => l.Address).WithMany().HasForeignKey(l => l.AddressId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class ServiceGroupConfiguration : IEntityTypeConfiguration<ServiceGroup>
{
    public void Configure(EntityTypeBuilder<ServiceGroup> builder)
    {
        builder.HasKey(g => g.Id);
        builder.Property(g => g.Name).IsRequired().HasMaxLength(300);
        builder.HasOne(g => g.Location).WithMany(l => l.ServiceGroups).HasForeignKey(g => g.LocationId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

public class ContractorConfiguration : IEntityTypeConfiguration<Contractor>
{
    public void Configure(EntityTypeBuilder<Contractor> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).IsRequired().HasMaxLength(300);
        builder.Property(c => c.TaxId).HasMaxLength(20);
        builder.Property(c => c.Phone).HasMaxLength(50);
        builder.Property(c => c.Email).HasMaxLength(200);
        builder.HasIndex(c => c.Name).HasFilter("[IsDeleted] = 0");
        builder.HasOne(c => c.Address).WithMany().HasForeignKey(c => c.AddressId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.FullName).IsRequired().HasMaxLength(300);
        builder.Property(e => e.LoginIdentifier).IsRequired().HasMaxLength(100);
        builder.Property(e => e.Phone).HasMaxLength(50);
        builder.Property(e => e.Email).HasMaxLength(200);
        builder.HasIndex(e => e.LoginIdentifier).IsUnique().HasFilter("[IsDeleted] = 0");

        builder.HasOne(e => e.Company).WithMany().HasForeignKey(e => e.CompanyId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(e => e.Contractor).WithMany(c => c.Employees).HasForeignKey(e => e.ContractorId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

public class ServiceGroupMemberConfiguration : IEntityTypeConfiguration<ServiceGroupMember>
{
    public void Configure(EntityTypeBuilder<ServiceGroupMember> builder)
    {
        builder.HasKey(m => m.Id);
        builder.HasIndex(m => new { m.ServiceGroupId, m.ContractorId }).IsUnique();

        builder.HasOne(m => m.ServiceGroup).WithMany(g => g.Members).HasForeignKey(m => m.ServiceGroupId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(m => m.Contractor).WithMany(c => c.ServiceGroupMemberships).HasForeignKey(m => m.ContractorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).IsRequired().HasMaxLength(300);
        builder.Property(c => c.Phone).HasMaxLength(50);
        builder.Property(c => c.Email).HasMaxLength(200);
        builder.HasIndex(c => new { c.CompanyId, c.Name }).HasFilter("[IsDeleted] = 0");

        builder.HasOne(c => c.Company).WithMany().HasForeignKey(c => c.CompanyId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(c => c.Location).WithMany().HasForeignKey(c => c.LocationId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(c => c.Address).WithMany().HasForeignKey(c => c.AddressId).OnDelete(DeleteBehavior.NoAction);
    }
}
