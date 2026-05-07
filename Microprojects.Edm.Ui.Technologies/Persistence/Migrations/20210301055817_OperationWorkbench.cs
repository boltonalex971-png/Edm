using Microsoft.EntityFrameworkCore.Migrations;

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    public partial class OperationWorkbench : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM [dbo].Records");
            migrationBuilder.Sql("DELETE FROM [dbo].OperationHostDevices");
            migrationBuilder.Sql("DELETE FROM [dbo].Operations");
            migrationBuilder.DropForeignKey(
                name: "FK_Operations_Processes_ProcessId",
                table: "Operations");

            migrationBuilder.RenameColumn(
                name: "ProcessId",
                table: "Operations",
                newName: "WorkbenchId");

            migrationBuilder.RenameIndex(
                name: "IX_Operations_ProcessId",
                table: "Operations",
                newName: "IX_Operations_WorkbenchId");

            migrationBuilder.AddForeignKey(
                name: "FK_Operations_Workbenches_WorkbenchId",
                table: "Operations",
                column: "WorkbenchId",
                principalTable: "Workbenches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Operations_Workbenches_WorkbenchId",
                table: "Operations");

            migrationBuilder.RenameColumn(
                name: "WorkbenchId",
                table: "Operations",
                newName: "ProcessId");

            migrationBuilder.RenameIndex(
                name: "IX_Operations_WorkbenchId",
                table: "Operations",
                newName: "IX_Operations_ProcessId");

            migrationBuilder.AddForeignKey(
                name: "FK_Operations_Processes_ProcessId",
                table: "Operations",
                column: "ProcessId",
                principalTable: "Processes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
