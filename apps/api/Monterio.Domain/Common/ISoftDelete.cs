namespace Monterio.Domain.Common;

/// <summary>Encje oznaczone tym interfejsem nie są fizycznie usuwane z bazy — Remove() jest
/// w AppDbContext.SaveChangesAsync konwertowane na IsDeleted = true, a globalny query filter
/// ukrywa usunięte rekordy. BaseEntity już ma MarkDeleted/Restore, więc encja tylko dopisuje
/// ": ISoftDelete" do listy interfejsów, bez żadnego dodatkowego kodu.</summary>
public interface ISoftDelete
{
    bool IsDeleted { get; }
    DateTime? DeletedAt { get; }
    string? DeletedBy { get; }
    void MarkDeleted(string? login);
    void Restore();
}
