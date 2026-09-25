using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Monterio.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            logger.LogWarning(ex, "Concurrency conflict on {Path}", context.Request.Path);
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                type = "ConcurrencyError",
                message = "Rekord został w międzyczasie zmieniony przez innego użytkownika. Odśwież dane i spróbuj ponownie."
            }));
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning("Business rule violation: {Message}", ex.Message);
            context.Response.StatusCode = StatusCodes.Status422UnprocessableEntity;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { type = "BusinessError", message = ex.Message }));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { type = "ServerError", message = "An unexpected error occurred." }));
        }
    }
}
