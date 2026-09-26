using Monterio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Monterio.Infrastructure.Persistence.Configurations;

public class RequestConfiguration : IEntityTypeConfiguration<Request>
{
    public void Configure(EntityTypeBuilder<Request> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Number).IsRequired().HasMaxLength(50);
        builder.Property(r => r.Description).HasMaxLength(2000);
        builder.Property(r => r.Status).HasConversion<int>();
        builder.HasIndex(r => r.Number).IsUnique().HasFilter("[IsDeleted] = 0");
        builder.HasIndex(r => new { r.CompanyId, r.Status });

        builder.HasOne(r => r.Company).WithMany().HasForeignKey(r => r.CompanyId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(r => r.Customer).WithMany(c => c.Requests).HasForeignKey(r => r.CustomerId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(r => r.Location).WithMany().HasForeignKey(r => r.LocationId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(r => r.Address).WithMany().HasForeignKey(r => r.AddressId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(r => r.ServiceGroup).WithMany().HasForeignKey(r => r.ServiceGroupId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(r => r.Contractor).WithMany().HasForeignKey(r => r.ContractorId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(r => r.Employee).WithMany().HasForeignKey(r => r.EmployeeId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(r => r.CreatedByEmployee).WithMany().HasForeignKey(r => r.CreatedByEmployeeId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

public class RequestNumberCounterConfiguration : IEntityTypeConfiguration<RequestNumberCounter>
{
    public void Configure(EntityTypeBuilder<RequestNumberCounter> builder)
    {
        builder.HasKey(c => new { c.CompanyId, c.Year });
        builder.HasOne<Company>().WithMany().HasForeignKey(c => c.CompanyId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class RequestActivityConfiguration : IEntityTypeConfiguration<RequestActivity>
{
    public void Configure(EntityTypeBuilder<RequestActivity> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Name).IsRequired().HasMaxLength(300);
        builder.HasOne(a => a.Request).WithMany(r => r.Activities).HasForeignKey(a => a.RequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class RequestActivityTaskConfiguration : IEntityTypeConfiguration<RequestActivityTask>
{
    public void Configure(EntityTypeBuilder<RequestActivityTask> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Description).IsRequired().HasMaxLength(500);
        builder.Property(t => t.MeasuredValueDecimal).HasPrecision(18, 6);
        builder.Property(t => t.MeasuredValueText).HasMaxLength(2000);
        builder.Property(t => t.MeasuredBy).HasMaxLength(200);

        builder.HasOne(t => t.Activity).WithMany(a => a.Tasks).HasForeignKey(t => t.RequestActivityId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(t => t.MeasurementAttribute).WithMany()
            .HasForeignKey(t => t.MeasurementAttributeId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class RequestAttachmentConfiguration : IEntityTypeConfiguration<RequestAttachment>
{
    public void Configure(EntityTypeBuilder<RequestAttachment> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.FileName).IsRequired().HasMaxLength(300);
        builder.Property(a => a.ContentType).IsRequired().HasMaxLength(200);
        builder.Property(a => a.StoragePath).IsRequired().HasMaxLength(1000);

        builder.HasOne(a => a.Request).WithMany(r => r.Attachments).HasForeignKey(a => a.RequestId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(a => a.UploadedByEmployee).WithMany().HasForeignKey(a => a.UploadedByEmployeeId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
