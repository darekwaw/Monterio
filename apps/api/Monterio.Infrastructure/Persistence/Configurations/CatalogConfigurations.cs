using Monterio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Monterio.Infrastructure.Persistence.Configurations;

public class MeasurementAttributeConfiguration : IEntityTypeConfiguration<MeasurementAttribute>
{
    public void Configure(EntityTypeBuilder<MeasurementAttribute> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Name).IsRequired().HasMaxLength(300);
        builder.Property(a => a.DataType).HasConversion<int>();
        builder.Property(a => a.Unit).HasMaxLength(50);
        builder.Property(a => a.MinValue).HasPrecision(18, 6);
        builder.Property(a => a.MaxValue).HasPrecision(18, 6);
        builder.Property(a => a.Options).HasMaxLength(2000);
    }
}

public class ServiceCatalogItemConfiguration : IEntityTypeConfiguration<ServiceCatalogItem>
{
    public void Configure(EntityTypeBuilder<ServiceCatalogItem> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Name).IsRequired().HasMaxLength(300);
        builder.Property(i => i.Description).HasMaxLength(2000);
    }
}

public class ServiceActivityConfiguration : IEntityTypeConfiguration<ServiceActivity>
{
    public void Configure(EntityTypeBuilder<ServiceActivity> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Name).IsRequired().HasMaxLength(300);

        builder.HasOne(a => a.ServiceCatalogItem).WithMany(i => i.Activities)
            .HasForeignKey(a => a.ServiceCatalogItemId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(a => a.MeasurementAttribute).WithMany()
            .HasForeignKey(a => a.MeasurementAttributeId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class PrintTemplateConfiguration : IEntityTypeConfiguration<PrintTemplate>
{
    public void Configure(EntityTypeBuilder<PrintTemplate> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Name).IsRequired().HasMaxLength(300);
        builder.Property(t => t.TemplateHtml).IsRequired().HasColumnType("nvarchar(max)");
    }
}
