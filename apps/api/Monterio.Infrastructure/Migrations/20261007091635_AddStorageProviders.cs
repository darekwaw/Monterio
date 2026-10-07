using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monterio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStorageProviders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StorageProvider",
                table: "RequestAttachments",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Local");

            migrationBuilder.CreateTable(
                name: "StorageProviderConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Provider = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ConfigurationEncrypted = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StorageProviderConfigs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StorageProviderConfigs_Provider",
                table: "StorageProviderConfigs",
                column: "Provider",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StorageProviderConfigs");

            migrationBuilder.DropColumn(
                name: "StorageProvider",
                table: "RequestAttachments");
        }
    }
}
