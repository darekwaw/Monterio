using Monterio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Monterio.Infrastructure.Persistence.Configurations;

public class StorageProviderConfigConfiguration : IEntityTypeConfiguration<StorageProviderConfig>
{
    public void Configure(EntityTypeBuilder<StorageProviderConfig> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Provider).IsRequired().HasMaxLength(30);
        builder.Property(c => c.ConfigurationEncrypted).IsRequired();
        builder.HasIndex(c => c.Provider).IsUnique();
    }
}
