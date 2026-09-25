using Monterio.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.Requests.Commands;

public record ToggleTaskCommand(int RequestId, int ActivityId, int TaskId) : IRequest;

public class ToggleTaskCommandHandler(IApplicationDbContext db) : IRequestHandler<ToggleTaskCommand>
{
    public async Task Handle(ToggleTaskCommand request, CancellationToken ct)
    {
        var task = await db.RequestActivityTasks
            .Include(t => t.Activity)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId && t.RequestActivityId == request.ActivityId
                && t.Activity.RequestId == request.RequestId, ct)
            ?? throw new InvalidOperationException($"Task {request.TaskId} not found.");
        task.ToggleDone();
        await db.SaveChangesAsync(ct);
    }
}

/// <summary>Zapisuje wartość punktu pomiarowego. Jedyny dom wartości — w odróżnieniu od CMMS nie
/// ma tu rozgałęzienia real-sprzęt/bez-sprzętu, bo Monterio nie ma Assetów w ogóle.</summary>
public record CompleteMeasurementTaskCommand(
    int RequestId, int ActivityId, int TaskId,
    decimal? ValueDecimal = null, string? ValueText = null, bool? ValueBoolean = null,
    DateTime? ValueDate = null) : IRequest<CompleteMeasurementTaskResult>;

public record CompleteMeasurementTaskResult(bool IsDone, bool IsOutOfRange);

public class CompleteMeasurementTaskCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<CompleteMeasurementTaskCommand, CompleteMeasurementTaskResult>
{
    public async Task<CompleteMeasurementTaskResult> Handle(CompleteMeasurementTaskCommand cmd, CancellationToken ct)
    {
        var task = await db.RequestActivityTasks
            .Include(t => t.Activity)
            .Include(t => t.MeasurementAttribute)
            .FirstOrDefaultAsync(t => t.Id == cmd.TaskId && t.RequestActivityId == cmd.ActivityId
                && t.Activity.RequestId == cmd.RequestId, ct)
            ?? throw new InvalidOperationException($"Task {cmd.TaskId} not found.");

        if (task.MeasurementAttributeId is null || task.MeasurementAttribute is null)
            throw new InvalidOperationException("Ta czynność nie jest powiązana z punktem pomiarowym.");

        var attr = task.MeasurementAttribute;
        var isOutOfRange = cmd.ValueDecimal.HasValue &&
            ((attr.MinValue.HasValue && cmd.ValueDecimal < attr.MinValue) ||
             (attr.MaxValue.HasValue && cmd.ValueDecimal > attr.MaxValue));

        task.RecordMeasurement(cmd.ValueDecimal, cmd.ValueText, cmd.ValueBoolean, cmd.ValueDate,
            currentUser.FullName ?? currentUser.LoginIdentifier);
        await db.SaveChangesAsync(ct);

        return new CompleteMeasurementTaskResult(task.IsDone, isOutOfRange);
    }
}
