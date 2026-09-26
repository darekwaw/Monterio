using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monterio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRequestNumberCounters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RequestNumberCounters",
                columns: table => new
                {
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    LastNumber = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestNumberCounters", x => new { x.CompanyId, x.Year });
                    table.ForeignKey(
                        name: "FK_RequestNumberCounters_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id");
                });

            // Zasiej licznik z istniejących numerów (format ZL/{rok}/{seq}) — inaczej pierwsze
            // zlecenie po migracji dostałoby numer "ZL/2026/0001", który może już istnieć.
            migrationBuilder.Sql("""
                INSERT INTO RequestNumberCounters (CompanyId, Year, LastNumber)
                SELECT CompanyId, CAST(SUBSTRING(Number, 4, 4) AS INT), MAX(CAST(SUBSTRING(Number, 9, LEN(Number)) AS INT))
                FROM Requests
                WHERE Number LIKE 'ZL/[0-9][0-9][0-9][0-9]/%'
                GROUP BY CompanyId, SUBSTRING(Number, 4, 4);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RequestNumberCounters");
        }
    }
}
