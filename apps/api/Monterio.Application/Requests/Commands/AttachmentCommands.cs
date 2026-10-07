using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Requests.Commands;

public record UploadAttachmentCommand(
    int RequestId, string FileName, string ContentType, byte[] Content, int UploadedByEmployeeId)
    : IRequest<int>;

public class UploadAttachmentCommandHandler(IApplicationDbContext db, IFileStorageService storage, IRequestHubService hubService)
    : IRequestHandler<UploadAttachmentCommand, int>
{
    public async Task<int> Handle(UploadAttachmentCommand request, CancellationToken ct)
    {
        var stored = await storage.SaveAsync(request.FileName, request.ContentType, request.Content, ct);

        var attachment = RequestAttachment.Create(
            request.RequestId, request.FileName, request.ContentType, request.Content.LongLength,
            stored.Provider, stored.Path, request.UploadedByEmployeeId);

        await db.RequestAttachments.AddAsync(attachment, ct);
        await db.SaveChangesAsync(ct);

        var companyId = await db.Requests.Where(r => r.Id == request.RequestId).Select(r => r.CompanyId).FirstAsync(ct);
        await hubService.NotifyRequestChanged(companyId, request.RequestId, ct);
        return attachment.Id;
    }
}
