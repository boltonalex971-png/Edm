using Microsoft.EntityFrameworkCore.Migrations;

namespace Optosense.Edm.DataAccess.Migrations
{
    public partial class Workbenches : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Workbenches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkplaceProcessId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Workbenches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Workbenches_WorkplaceProcesses_WorkplaceProcessId",
                        column: x => x.WorkplaceProcessId,
                        principalTable: "WorkplaceProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkbenchDeviceConfigurations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkbenchId = table.Column<int>(type: "int", nullable: false),
                    WorkplaceHostDeviceId = table.Column<int>(type: "int", nullable: false),
                    Configuration = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkbenchDeviceConfigurations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkbenchDeviceConfigurations_Workbenches_WorkbenchId",
                        column: x => x.WorkbenchId,
                        principalTable: "Workbenches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkbenchDeviceConfigurations_WorkplaceHostDevices_WorkplaceHostDeviceId",
                        column: x => x.WorkplaceHostDeviceId,
                        principalTable: "WorkplaceHostDevices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkbenchDeviceConfigurations_WorkbenchId",
                table: "WorkbenchDeviceConfigurations",
                column: "WorkbenchId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkbenchDeviceConfigurations_WorkplaceHostDeviceId",
                table: "WorkbenchDeviceConfigurations",
                column: "WorkplaceHostDeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_Workbenches_WorkplaceProcessId",
                table: "Workbenches",
                column: "WorkplaceProcessId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkbenchDeviceConfigurations");

            migrationBuilder.DropTable(
                name: "Workbenches");
        }
    }
}
