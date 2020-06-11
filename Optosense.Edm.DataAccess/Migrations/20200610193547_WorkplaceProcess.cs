using Microsoft.EntityFrameworkCore.Migrations;

namespace Optosense.Edm.DataAccess.Migrations
{
    public partial class WorkplaceProcess : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkplaceProcess_Processes_ProcessId",
                table: "WorkplaceProcess");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkplaceProcess_Workplaces_WorkplaceId",
                table: "WorkplaceProcess");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WorkplaceProcess",
                table: "WorkplaceProcess");

            migrationBuilder.RenameTable(
                name: "WorkplaceProcess",
                newName: "WorkplaceProcesses");

            migrationBuilder.RenameIndex(
                name: "IX_WorkplaceProcess_WorkplaceId",
                table: "WorkplaceProcesses",
                newName: "IX_WorkplaceProcesses_WorkplaceId");

            migrationBuilder.RenameIndex(
                name: "IX_WorkplaceProcess_ProcessId",
                table: "WorkplaceProcesses",
                newName: "IX_WorkplaceProcesses_ProcessId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WorkplaceProcesses",
                table: "WorkplaceProcesses",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkplaceProcesses_Processes_ProcessId",
                table: "WorkplaceProcesses",
                column: "ProcessId",
                principalTable: "Processes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkplaceProcesses_Workplaces_WorkplaceId",
                table: "WorkplaceProcesses",
                column: "WorkplaceId",
                principalTable: "Workplaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkplaceProcesses_Processes_ProcessId",
                table: "WorkplaceProcesses");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkplaceProcesses_Workplaces_WorkplaceId",
                table: "WorkplaceProcesses");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WorkplaceProcesses",
                table: "WorkplaceProcesses");

            migrationBuilder.RenameTable(
                name: "WorkplaceProcesses",
                newName: "WorkplaceProcess");

            migrationBuilder.RenameIndex(
                name: "IX_WorkplaceProcesses_WorkplaceId",
                table: "WorkplaceProcess",
                newName: "IX_WorkplaceProcess_WorkplaceId");

            migrationBuilder.RenameIndex(
                name: "IX_WorkplaceProcesses_ProcessId",
                table: "WorkplaceProcess",
                newName: "IX_WorkplaceProcess_ProcessId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WorkplaceProcess",
                table: "WorkplaceProcess",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkplaceProcess_Processes_ProcessId",
                table: "WorkplaceProcess",
                column: "ProcessId",
                principalTable: "Processes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkplaceProcess_Workplaces_WorkplaceId",
                table: "WorkplaceProcess",
                column: "WorkplaceId",
                principalTable: "Workplaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
