using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using MediatR;

namespace Monterio.Application.Requests.Commands;

public record UploadAttachmentCommand(
    int RequestId, string FileName, string ContentType, byte[] Content, int UploadedByEmployeeId)
    : IRequest<int>;

public class UploadAttachmentCommandHandler(IApplicationDbContext db, IFileStorageService storage)
    : IRequestHandler<UploadAttachmentCommand, int>
{
    public async Task<int> Handle(UploadAttachmentCommand request, CancellationToken ct)
    {
        var storagePath = await storage.SaveAsync(request.FileName, request.Content, ct);

        var attachment = RequestAttachment.Create(
            request.RequestId, request.FileName, request.ContentType, request.Content.LongLength,
            storagePath, request.UploadedByEmployeeId);

        await db.RequestAttachments.AddAsync(attachment, ct);
        await db.SaveChangesAsync(ct);
        return attachment.Id;
    }
}
