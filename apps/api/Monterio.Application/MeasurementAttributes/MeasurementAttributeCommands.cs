using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;
using Monterio.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Monterio.Application.MeasurementAttributes;

public record CreateMeasurementAttributeCommand(
    string Name, AttributeDataType DataType, string? Unit = null,
    decimal? MinValue = null, decimal? MaxValue = null, string? Options = null) : IRequest<int>;

public class CreateMeasurementAttributeCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateMeasurementAttributeCommand, int>
{
    public async Task<int> Handle(CreateMeasurementAttributeCommand request, CancellationToken ct)
    {
        var attr = MeasurementAttribute.Create(request.Name, request.DataType, request.Unit,
            request.MinValue, request.MaxValue, request.Options);
        await db.MeasurementAttributes.AddAsync(attr, ct);
        await db.SaveChangesAsync(ct);
        return attr.Id;
    }
}

public record UpdateMeasurementAttributeCommand(
    int Id, string Name, AttributeDataType DataType, string? Unit, decimal? MinValue,
    decimal? MaxValue, string? Options, bool IsActive) : IRequest;

public class UpdateMeasurementAttributeCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateMeasurementAttributeCommand>
{
    public async Task Handle(UpdateMeasurementAttributeCommand request, CancellationToken ct)
    {
        var attr = await db.MeasurementAttributes.FirstOrDefaultAsync(a => a.Id == request.Id, ct)
            ?? throw new InvalidOperationException($"MeasurementAttribute {request.Id} not found.");
        attr.Update(request.Name, request.DataType, request.Unit, request.MinValue, request.MaxValue,
            request.Options, request.IsActive);
        await db.SaveChangesAsync(ct);
    }
}

public record GetMeasurementAttributesQuery : IRequest<List<MeasurementAttributeDto>>;

public record MeasurementAttributeDto(int Id, string Name, int DataType, string? Unit,
    decimal? MinValue, decimal? MaxValue, string? Options, bool IsActive);

public class GetMeasurementAttributesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetMeasurementAttributesQuery, List<MeasurementAttributeDto>>
{
    public async Task<List<MeasurementAttributeDto>> Handle(GetMeasurementAttributesQuery request, CancellationToken ct)
    {
        var attrs = await db.MeasurementAttributes.Where(a => a.IsActive).OrderBy(a => a.Name).ToListAsync(ct);
        return attrs.Select(a => new MeasurementAttributeDto(
            a.Id, a.Name, (int)a.DataType, a.Unit, a.MinValue, a.MaxValue, a.Options, a.IsActive)).ToList();
    }
}
