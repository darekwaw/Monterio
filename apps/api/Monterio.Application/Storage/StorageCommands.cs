using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Storage;

public record GetStorageSettingsQuery : IRequest<StorageSettingsDto>;

public class GetStorageSettingsQueryHandler(IStorageAdminService admin)
    : IRequestHandler<GetStorageSettingsQuery, StorageSettingsDto>
{
    public Task<StorageSettingsDto> Handle(GetStorageSettingsQuery request, CancellationToken ct)
        => admin.GetSettingsAsync(ct);
}

public record SaveStorageSettingsCommand(string Provider, IReadOnlyDictionary<string, string?> Values) : IRequest;

public class SaveStorageSettingsCommandHandler(IStorageAdminService admin) : IRequestHandler<SaveStorageSettingsCommand>
{
    public Task Handle(SaveStorageSettingsCommand request, CancellationToken ct)
        => admin.SaveAndActivateAsync(request.Provider, request.Values, ct);
}

public record TestStorageCommand(string Provider, IReadOnlyDictionary<string, string?> Values) : IRequest<StorageTestResult>;

public class TestStorageCommandHandler(IStorageAdminService admin) : IRequestHandler<TestStorageCommand, StorageTestResult>
{
    public Task<StorageTestResult> Handle(TestStorageCommand request, CancellationToken ct)
        => admin.TestAsync(request.Provider, request.Values, ct);
}

public record MigrateStorageResult(int Succeeded, int Failed, IReadOnlyList<string> Errors);

/// <summary>Przenosi załączniki leżące na dysku lokalnym do aktywnego dostawcy chmury. Pliki lokalne
/// zostają nietknięte (kasowanie to świadoma, ręczna decyzja po sprawdzeniu wyniku).</summary>
public record MigrateLocalAttachmentsCommand : IRequest<MigrateStorageResult>;

public class MigrateLocalAttachmentsCommandHandler(
    IApplicationDbContext db, IFileStorageService storage, IStorageAdminService admin)
    : IRequestHandler<MigrateLocalAttachmentsCommand, MigrateStorageResult>
{
    public async Task<MigrateStorageResult> Handle(MigrateLocalAttachmentsCommand request, CancellationToken ct)
    {
        var settings = await admin.GetSettingsAsync(ct);
        if (settings.ActiveProvider == StorageProviders.Local)
            throw new InvalidOperationException("Aktywny jest dysk lokalny — najpierw zapisz i aktywuj dostawcę chmury.");

        var attachments = await db.RequestAttachments
            .Where(a => a.StorageProvider == StorageProviders.Local)
            .ToListAsync(ct);

        int succeeded = 0, failed = 0;
        var errors = new List<string>();

        foreach (var att in attachments)
        {
            try
            {
                var content = await storage.ReadAsync(att.StorageProvider, att.StoragePath, ct);
                var stored = await storage.SaveAsync(att.FileName, att.ContentType, content, ct);
                att.MoveTo(stored.Provider, stored.Path);
                succeeded++;
            }
            catch (Exception ex)
            {
                failed++;
                errors.Add($"Załącznik {att.Id} ({att.FileName}): {ex.Message}");
            }
        }

        await db.SaveChangesAsync(ct);
        return new MigrateStorageResult(succeeded, failed, errors);
    }
}
