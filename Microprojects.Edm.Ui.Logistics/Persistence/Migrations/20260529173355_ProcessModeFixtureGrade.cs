using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProcessModeFixtureGrade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FixtureTareTypeId",
                table: "Processes",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Mode",
                table: "Processes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsTerminating",
                table: "Grades",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Processes_FixtureTareTypeId",
                table: "Processes",
                column: "FixtureTareTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Processes_TareTypes_FixtureTareTypeId",
                table: "Processes",
                column: "FixtureTareTypeId",
                principalTable: "TareTypes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Processes_TareTypes_FixtureTareTypeId",
                table: "Processes");

            migrationBuilder.DropIndex(
                name: "IX_Processes_FixtureTareTypeId",
                table: "Processes");

            migrationBuilder.DropColumn(
                name: "FixtureTareTypeId",
                table: "Processes");

            migrationBuilder.DropColumn(
                name: "Mode",
                table: "Processes");

            migrationBuilder.DropColumn(
                name: "IsTerminating",
                table: "Grades");
        }
    }
}
