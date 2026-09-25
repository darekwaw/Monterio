namespace Monterio.Domain.Common;

public abstract class BaseEntity
{
    public int Id { get; protected set; }
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; protected set; } = DateTime.UtcNow;
    public string? CreatedBy { get; protected set; }
    public string? UpdatedBy { get; protected set; }

    /// <summary>Token współbieżności (SQL Server rowversion) — optimistic locking.</summary>
    public byte[] RowVersion { get; protected set; } = [];

    public bool IsDeleted { get; protected set; }
    public DateTime? DeletedAt { get; protected set; }
    public string? DeletedBy { get; protected set; }

    public void SetUpdatedAt() => UpdatedAt = DateTime.UtcNow;
    public void SetCreatedBy(string? login) => CreatedBy = login;
    public void SetUpdatedBy(string? login) { UpdatedBy = login; UpdatedAt = DateTime.UtcNow; }

    public void MarkDeleted(string? login)
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        DeletedBy = login;
    }

    public void Restore()
    {
        IsDeleted = false;
        DeletedAt = null;
        DeletedBy = null;
    }

    public void SetRowVersion(byte[] rowVersion) => RowVersion = rowVersion;
}
