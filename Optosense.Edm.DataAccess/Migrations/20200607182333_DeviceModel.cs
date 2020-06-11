using Microsoft.EntityFrameworkCore.Migrations;

namespace Optosense.Edm.DataAccess.Migrations
{
    public partial class DeviceModel : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HostDevices_Workplaces_WorkplaceId",
                table: "HostDevices");

            migrationBuilder.DropIndex(
                name: "IX_HostDevices_WorkplaceId",
                table: "HostDevices");

            migrationBuilder.DropColumn(
                name: "WorkplaceId",
                table: "HostDevices");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Devices");

            migrationBuilder.AddColumn<int>(
                name: "Model",
                table: "Devices",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "WorkplaceHostDevice",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkplaceId = table.Column<int>(nullable: false),
                    HostDeviceId = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkplaceHostDevice", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkplaceHostDevice_HostDevices_HostDeviceId",
                        column: x => x.HostDeviceId,
                        principalTable: "HostDevices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkplaceHostDevice_Workplaces_WorkplaceId",
                        column: x => x.WorkplaceId,
                        principalTable: "Workplaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkplaceProcess",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkplaceId = table.Column<int>(nullable: false),
                    ProcessId = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkplaceProcess", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkplaceProcess_Processes_ProcessId",
                        column: x => x.ProcessId,
                        principalTable: "Processes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkplaceProcess_Workplaces_WorkplaceId",
                        column: x => x.WorkplaceId,
                        principalTable: "Workplaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkplaceHostDevice_HostDeviceId",
                table: "WorkplaceHostDevice",
                column: "HostDeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkplaceHostDevice_WorkplaceId",
                table: "WorkplaceHostDevice",
                column: "WorkplaceId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkplaceProcess_ProcessId",
                table: "WorkplaceProcess",
                column: "ProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkplaceProcess_WorkplaceId",
                table: "WorkplaceProcess",
                column: "WorkplaceId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkplaceHostDevice");

            migrationBuilder.DropTable(
                name: "WorkplaceProcess");

            migrationBuilder.DropColumn(
                name: "Model",
                table: "Devices");

            migrationBuilder.AddColumn<int>(
                name: "WorkplaceId",
                table: "HostDevices",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Devices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_HostDevices_WorkplaceId",
                table: "HostDevices",
                column: "WorkplaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_HostDevices_Workplaces_WorkplaceId",
                table: "HostDevices",
                column: "WorkplaceId",
                principalTable: "Workplaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
