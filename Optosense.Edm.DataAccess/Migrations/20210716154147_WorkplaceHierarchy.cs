using Microsoft.EntityFrameworkCore.Migrations;

namespace Optosense.Edm.DataAccess.Migrations
{
    public partial class WorkplaceHierarchy : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HierarchyId",
                table: "Workplaces",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Workplaces_HierarchyId",
                table: "Workplaces",
                column: "HierarchyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Workplaces_Hierarchies_HierarchyId",
                table: "Workplaces",
                column: "HierarchyId",
                principalTable: "Hierarchies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.Sql("UPDATE dbo.Workplaces SET HierarchyId=4");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Workplaces_Hierarchies_HierarchyId",
                table: "Workplaces");

            migrationBuilder.DropIndex(
                name: "IX_Workplaces_HierarchyId",
                table: "Workplaces");

            migrationBuilder.DropColumn(
                name: "HierarchyId",
                table: "Workplaces");
        }
    }
}
