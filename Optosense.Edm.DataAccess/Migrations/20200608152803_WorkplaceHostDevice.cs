using Microsoft.EntityFrameworkCore.Migrations;

namespace Optosense.Edm.DataAccess.Migrations
{
    public partial class WorkplaceHostDevice : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkplaceHostDevice_HostDevices_HostDeviceId",
                table: "WorkplaceHostDevice");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkplaceHostDevice_Workplaces_WorkplaceId",
                table: "WorkplaceHostDevice");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WorkplaceHostDevice",
                table: "WorkplaceHostDevice");

            migrationBuilder.RenameTable(
                name: "WorkplaceHostDevice",
                newName: "WorkplaceHostDevices");

            migrationBuilder.RenameIndex(
                name: "IX_WorkplaceHostDevice_WorkplaceId",
                table: "WorkplaceHostDevices",
                newName: "IX_WorkplaceHostDevices_WorkplaceId");

            migrationBuilder.RenameIndex(
                name: "IX_WorkplaceHostDevice_HostDeviceId",
                table: "WorkplaceHostDevices",
                newName: "IX_WorkplaceHostDevices_HostDeviceId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WorkplaceHostDevices",
                table: "WorkplaceHostDevices",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkplaceHostDevices_HostDevices_HostDeviceId",
                table: "WorkplaceHostDevices",
                column: "HostDeviceId",
                principalTable: "HostDevices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkplaceHostDevices_Workplaces_WorkplaceId",
                table: "WorkplaceHostDevices",
                column: "WorkplaceId",
                principalTable: "Workplaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkplaceHostDevices_HostDevices_HostDeviceId",
                table: "WorkplaceHostDevices");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkplaceHostDevices_Workplaces_WorkplaceId",
                table: "WorkplaceHostDevices");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WorkplaceHostDevices",
                table: "WorkplaceHostDevices");

            migrationBuilder.RenameTable(
                name: "WorkplaceHostDevices",
                newName: "WorkplaceHostDevice");

            migrationBuilder.RenameIndex(
                name: "IX_WorkplaceHostDevices_WorkplaceId",
                table: "WorkplaceHostDevice",
                newName: "IX_WorkplaceHostDevice_WorkplaceId");

            migrationBuilder.RenameIndex(
                name: "IX_WorkplaceHostDevices_HostDeviceId",
                table: "WorkplaceHostDevice",
                newName: "IX_WorkplaceHostDevice_HostDeviceId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WorkplaceHostDevice",
                table: "WorkplaceHostDevice",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkplaceHostDevice_HostDevices_HostDeviceId",
                table: "WorkplaceHostDevice",
                column: "HostDeviceId",
                principalTable: "HostDevices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkplaceHostDevice_Workplaces_WorkplaceId",
                table: "WorkplaceHostDevice",
                column: "WorkplaceId",
                principalTable: "Workplaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
