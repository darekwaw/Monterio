using Monterio.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Monterio.Infrastructure.Services;

/// <summary>Zapis na lokalny dysk — jedyny provider na start (MVP). Ten sam wzorzec co "Local"
/// provider w CMMS; S3/MinIO można dodać później przez tę samą interfejs.</summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly string _uploadPath;

    public LocalFileStorageService(IConfiguration config)
    {
        _uploadPath = config["Storage:Local:UploadPath"] ?? "uploads";
        Directory.CreateDirectory(_uploadPath);
    }

    public async Task<string> SaveAsync(string fileName, byte[] content, CancellationToken ct)
    {
        var safeName = $"{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
        var fullPath = Path.Combine(_uploadPath, safeName);
        await File.WriteAllBytesAsync(fullPath, content, ct);
        return safeName;
    }

    public Task<byte[]> ReadAsync(string storagePath, CancellationToken ct)
        => File.ReadAllBytesAsync(Path.Combine(_uploadPath, storagePath), ct);
}
