using Minio;
using Minio.DataModel.Args;
using Monterio.Application.Common.Interfaces;
using Monterio.Domain.Entities;

namespace Monterio.Infrastructure.Storage;

/// <summary>Magazyn obiektowy zgodny z S3: Amazon S3, MinIO, Wasabi, Backblaze B2, DigitalOcean Spaces...</summary>
public class S3StorageBackend : IStorageBackend
{
    public string Provider => StorageProviders.S3;
    public string Label => "S3 / MinIO";
    public string Description => "Amazon S3 lub własny serwer zgodny z S3 (MinIO, Wasabi, Backblaze B2).";
    public bool IsCloud => true;

    public IReadOnlyList<StorageFieldDto> Fields { get; } =
    [
        new("Endpoint", "Endpoint", Placeholder: "s3.eu-central-1.amazonaws.com lub minio.firma.pl:9000",
            Help: "Sam host (z portem, jeśli niestandardowy), bez https://."),
        new("Bucket", "Bucket", Placeholder: "monterio"),
        new("AccessKey", "Access Key"),
        new("SecretKey", "Secret Key", Type: "password", Secret: true),
        new("Region", "Region", Required: false, Placeholder: "eu-central-1", Help: "Wymagany przez część dostawców (np. AWS)."),
        new("UseSsl", "Połączenie szyfrowane (HTTPS)", Type: "checkbox", Required: false),
    ];

    public async Task<string> SaveAsync(IReadOnlyDictionary<string, string> cfg, string fileName, string contentType,
        byte[] content, CancellationToken ct)
    {
        var client = BuildClient(cfg);
        var bucket = cfg.Get("Bucket");
        if (!await client.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucket), ct))
            await client.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucket), ct);

        var key = StorageBackendHelpers.UniqueKey(fileName);
        using var stream = new MemoryStream(content);
        await client.PutObjectAsync(new PutObjectArgs()
            .WithBucket(bucket)
            .WithObject(key)
            .WithStreamData(stream)
            .WithObjectSize(content.LongLength)
            .WithContentType(string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType), ct);
        return key;
    }

    public async Task<byte[]> ReadAsync(IReadOnlyDictionary<string, string> cfg, string path, CancellationToken ct)
    {
        var client = BuildClient(cfg);
        using var ms = new MemoryStream();
        await client.GetObjectAsync(new GetObjectArgs()
            .WithBucket(cfg.Get("Bucket"))
            .WithObject(path)
            .WithCallbackStream(s => s.CopyTo(ms)), ct);
        return ms.ToArray();
    }

    public async Task DeleteAsync(IReadOnlyDictionary<string, string> cfg, string path, CancellationToken ct)
    {
        var client = BuildClient(cfg);
        await client.RemoveObjectAsync(new RemoveObjectArgs().WithBucket(cfg.Get("Bucket")).WithObject(path), ct);
    }

    private static IMinioClient BuildClient(IReadOnlyDictionary<string, string> cfg)
    {
        var builder = new MinioClient()
            .WithEndpoint(cfg.Get("Endpoint"))
            .WithCredentials(cfg.Get("AccessKey"), cfg.Get("SecretKey"));
        if (cfg.Get("UseSsl").Equals("true", StringComparison.OrdinalIgnoreCase)) builder = builder.WithSSL();
        var region = cfg.Get("Region");
        if (!string.IsNullOrEmpty(region)) builder = builder.WithRegion(region);
        return builder.Build();
    }
}
