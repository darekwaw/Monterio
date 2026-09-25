namespace Monterio.Application.Common.Interfaces;

public interface IFileStorageService
{
    /// <summary>Zapisuje plik i zwraca ścieżkę/klucz do późniejszego odczytu.</summary>
    Task<string> SaveAsync(string fileName, byte[] content, CancellationToken ct);
    Task<byte[]> ReadAsync(string storagePath, CancellationToken ct);
}
