using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Monterio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRequestCompletionDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletionDate",
                table: "Requests",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletionDate",
                table: "Requests");
        }
    }
}
