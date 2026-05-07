using Microsoft.EntityFrameworkCore.Migrations;

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    public partial class ProcessProfiles : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM Profiles");

            migrationBuilder.DropColumn(
                name: "DeviceTypes",
                table: "Processes");

            migrationBuilder.RenameColumn(
                name: "Model",
                table: "Profiles",
                newName: "Type");

            migrationBuilder.AddColumn<int>(
                name: "ProcessId",
                table: "Profiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Profiles_ProcessId",
                table: "Profiles",
                column: "ProcessId");

            migrationBuilder.AddForeignKey(
                name: "FK_Profiles_Processes_ProcessId",
                table: "Profiles",
                column: "ProcessId",
                principalTable: "Processes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Profiles_Processes_ProcessId",
                table: "Profiles");

            migrationBuilder.DropIndex(
                name: "IX_Profiles_ProcessId",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "ProcessId",
                table: "Profiles");

            migrationBuilder.RenameColumn(
                name: "Type",
                table: "Profiles",
                newName: "Model");

            migrationBuilder.AddColumn<string>(
                name: "DeviceTypes",
                table: "Processes",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
