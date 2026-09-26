using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monterio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRequestRating : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Rating",
                table: "Requests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RatingComment",
                table: "Requests",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Rating",
                table: "Requests");

            migrationBuilder.DropColumn(
                name: "RatingComment",
                table: "Requests");
        }
    }
}
