using Monterio.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Requests.Queries;

public record GetAttachmentQuery(int RequestId, int AttachmentId) : IRequest<AttachmentFileResult?>;

public record AttachmentFileResult(string FileName, string ContentType, byte[] Content);

public class GetAttachmentQueryHandler(IApplicationDbContext db, IFileStorageService storage)
    : IRequestHandler<GetAttachmentQuery, AttachmentFileResult?>
{
    public async Task<AttachmentFileResult?> Handle(GetAttachmentQuery request, CancellationToken ct)
    {
        var attachment = await db.RequestAttachments
            .FirstOrDefaultAsync(a => a.Id == request.AttachmentId && a.RequestId == request.RequestId, ct);
        if (attachment is null) return null;

        var content = await storage.ReadAsync(attachment.StoragePath, ct);
        return new AttachmentFileResult(attachment.FileName, attachment.ContentType, content);
    }
}
