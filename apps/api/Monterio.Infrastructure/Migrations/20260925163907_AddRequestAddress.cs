using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monterio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRequestAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AddressId",
                table: "Requests",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Requests_AddressId",
                table: "Requests",
                column: "AddressId");

            migrationBuilder.AddForeignKey(
                name: "FK_Requests_Addresses_AddressId",
                table: "Requests",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Requests_Addresses_AddressId",
                table: "Requests");

            migrationBuilder.DropIndex(
                name: "IX_Requests_AddressId",
                table: "Requests");

            migrationBuilder.DropColumn(
                name: "AddressId",
                table: "Requests");
        }
    }
}
