using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Optosense.Edm.DataAccess.Migrations
{
    public partial class Initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Devices",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(nullable: true),
                    Description = table.Column<string>(nullable: true),
                    IsActive = table.Column<bool>(nullable: false),
                    Type = table.Column<int>(nullable: false),
                    Parameters = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Devices", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Hosts",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(nullable: true),
                    Description = table.Column<string>(nullable: true),
                    IsActive = table.Column<bool>(nullable: false),
                    Url = table.Column<string>(nullable: true),
                    Port = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hosts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Processes",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Created = table.Column<DateTime>(nullable: false),
                    Started = table.Column<DateTime>(nullable: true),
                    Completed = table.Column<DateTime>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Processes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Profiles",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Profiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HostDevices",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeviceId = table.Column<int>(nullable: false),
                    HostId = table.Column<int>(nullable: false),
                    Parameters = table.Column<string>(nullable: true),
                    IsActive = table.Column<bool>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HostDevices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HostDevices_Devices_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "Devices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HostDevices_Hosts_HostId",
                        column: x => x.HostId,
                        principalTable: "Hosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProfilePoint",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProfileId = table.Column<int>(nullable: false),
                    Order = table.Column<int>(nullable: false),
                    Offset = table.Column<long>(nullable: false),
                    Operation = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProfilePoint", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProfilePoint_Profiles_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProcessHostDevices",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProcessId = table.Column<int>(nullable: false),
                    HostDeviceId = table.Column<int>(nullable: false),
                    ProfileId = table.Column<int>(nullable: false),
                    Options = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessHostDevices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessHostDevices_HostDevices_HostDeviceId",
                        column: x => x.HostDeviceId,
                        principalTable: "HostDevices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProcessHostDevices_Processes_ProcessId",
                        column: x => x.ProcessId,
                        principalTable: "Processes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProcessHostDevices_Profiles_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Records",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProcessHostDeviceId = table.Column<int>(nullable: false),
                    ScheduledAt = table.Column<DateTime>(nullable: false),
                    ExecutedAt = table.Column<DateTime>(nullable: false),
                    Parameters = table.Column<string>(nullable: true),
                    Request = table.Column<string>(nullable: true),
                    Response = table.Column<string>(nullable: true),
                    Info = table.Column<string>(nullable: true),
                    Status = table.Column<int>(nullable: false),
                    IsValid = table.Column<bool>(nullable: false),
                    Message = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Records", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Records_ProcessHostDevices_ProcessHostDeviceId",
                        column: x => x.ProcessHostDeviceId,
                        principalTable: "ProcessHostDevices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HostDevices_DeviceId",
                table: "HostDevices",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_HostDevices_HostId",
                table: "HostDevices",
                column: "HostId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessHostDevices_HostDeviceId",
                table: "ProcessHostDevices",
                column: "HostDeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessHostDevices_ProcessId",
                table: "ProcessHostDevices",
                column: "ProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessHostDevices_ProfileId",
                table: "ProcessHostDevices",
                column: "ProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_ProfilePoint_ProfileId",
                table: "ProfilePoint",
                column: "ProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Records_ProcessHostDeviceId",
                table: "Records",
                column: "ProcessHostDeviceId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProfilePoint");

            migrationBuilder.DropTable(
                name: "Records");

            migrationBuilder.DropTable(
                name: "ProcessHostDevices");

            migrationBuilder.DropTable(
                name: "HostDevices");

            migrationBuilder.DropTable(
                name: "Processes");

            migrationBuilder.DropTable(
                name: "Profiles");

            migrationBuilder.DropTable(
                name: "Devices");

            migrationBuilder.DropTable(
                name: "Hosts");
        }
    }
}
