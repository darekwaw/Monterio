using Monterio.Domain.Common;

namespace Monterio.Domain.Entities;

/// <summary>Załącznik do zlecenia (zdjęcie, dokument) — jedna z dwóch rzeczy, które klientowi
/// zrobiły "WOW" na demie.</summary>
public class RequestAttachment : BaseEntity
{
    public int RequestId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long FileSize { get; private set; }
    public string StoragePath { get; private set; } = string.Empty;
    public int UploadedByEmployeeId { get; private set; }

    public Request Request { get; private set; } = null!;
    public Employee UploadedByEmployee { get; private set; } = null!;

    private RequestAttachment() { }

    public static RequestAttachment Create(int requestId, string fileName, string contentType,
        long fileSize, string storagePath, int uploadedByEmployeeId)
        => new()
        {
            RequestId = requestId,
            FileName = fileName,
            ContentType = contentType,
            FileSize = fileSize,
            StoragePath = storagePath,
            UploadedByEmployeeId = uploadedByEmployeeId,
        };
}
