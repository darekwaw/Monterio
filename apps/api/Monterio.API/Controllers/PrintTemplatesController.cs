using Monterio.Application.PrintTemplates;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Monterio.API.Controllers;

[Tags("Szablony wydruku")]
[ApiController]
[Route("api/print-templates")]
[Authorize]
public class PrintTemplatesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await sender.Send(new GetPrintTemplatesQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePrintTemplateRequest body, CancellationToken ct)
    {
        var id = await sender.Send(new CreatePrintTemplateCommand(body.Name, body.TemplateHtml), ct);
        return Ok(new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePrintTemplateRequest body, CancellationToken ct)
    {
        await sender.Send(new UpdatePrintTemplateCommand(id, body.Name, body.TemplateHtml, body.IsActive), ct);
        return NoContent();
    }

    [HttpPost("{id:int}/set-default")]
    public async Task<IActionResult> SetDefault(int id, CancellationToken ct)
    {
        await sender.Send(new SetDefaultPrintTemplateCommand(id), ct);
        return NoContent();
    }
}

public record CreatePrintTemplateRequest(string Name, string TemplateHtml);
public record UpdatePrintTemplateRequest(string Name, string TemplateHtml, bool IsActive);
