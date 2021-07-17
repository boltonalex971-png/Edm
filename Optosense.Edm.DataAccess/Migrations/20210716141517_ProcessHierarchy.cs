using Microsoft.EntityFrameworkCore.Migrations;

namespace Optosense.Edm.DataAccess.Migrations
{
    public partial class ProcessHierarchy : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HierarchyId",
                table: "Processes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Processes_HierarchyId",
                table: "Processes",
                column: "HierarchyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Processes_Hierarchies_HierarchyId",
                table: "Processes",
                column: "HierarchyId",
                principalTable: "Hierarchies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.Sql("UPDATE dbo.Processes SET HierarchyId=3");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Processes_Hierarchies_HierarchyId",
                table: "Processes");

            migrationBuilder.DropIndex(
                name: "IX_Processes_HierarchyId",
                table: "Processes");

            migrationBuilder.DropColumn(
                name: "HierarchyId",
                table: "Processes");
        }
    }
}
