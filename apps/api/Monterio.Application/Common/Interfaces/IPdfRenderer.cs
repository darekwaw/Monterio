namespace Monterio.Application.Common.Interfaces;

public interface IPdfRenderer
{
    Task<byte[]> RenderHtmlToPdfAsync(string html, CancellationToken ct);
}
