using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monterio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRequestPrintTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PrintTemplateId",
                table: "Requests",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Requests_PrintTemplateId",
                table: "Requests",
                column: "PrintTemplateId");

            migrationBuilder.AddForeignKey(
                name: "FK_Requests_PrintTemplates_PrintTemplateId",
                table: "Requests",
                column: "PrintTemplateId",
                principalTable: "PrintTemplates",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Requests_PrintTemplates_PrintTemplateId",
                table: "Requests");

            migrationBuilder.DropIndex(
                name: "IX_Requests_PrintTemplateId",
                table: "Requests");

            migrationBuilder.DropColumn(
                name: "PrintTemplateId",
                table: "Requests");
        }
    }
}
