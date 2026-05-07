using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    public partial class OperationCancelled : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "Cancelled",
                table: "Operations",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Scheduled",
                table: "Operations",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cancelled",
                table: "Operations");

            migrationBuilder.DropColumn(
                name: "Scheduled",
                table: "Operations");
        }
    }
}
