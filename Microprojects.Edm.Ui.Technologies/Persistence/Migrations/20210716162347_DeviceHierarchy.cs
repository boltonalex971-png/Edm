using Microsoft.EntityFrameworkCore.Migrations;

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    public partial class DeviceHierarchy : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HierarchyId",
                table: "Devices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Devices_HierarchyId",
                table: "Devices",
                column: "HierarchyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Devices_Hierarchies_HierarchyId",
                table: "Devices",
                column: "HierarchyId",
                principalTable: "Hierarchies",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.Sql("UPDATE dbo.Devices SET HierarchyId=2");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Devices_Hierarchies_HierarchyId",
                table: "Devices");

            migrationBuilder.DropIndex(
                name: "IX_Devices_HierarchyId",
                table: "Devices");

            migrationBuilder.DropColumn(
                name: "HierarchyId",
                table: "Devices");
        }
    }
}
