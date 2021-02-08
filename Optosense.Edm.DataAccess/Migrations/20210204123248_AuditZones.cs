using Microsoft.EntityFrameworkCore.Migrations;

namespace Optosense.Edm.DataAccess.Migrations
{
    public partial class AuditZones : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditZones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AuditId = table.Column<int>(type: "int", nullable: false),
                    No = table.Column<int>(type: "int", nullable: true),
                    Offset = table.Column<int>(type: "int", nullable: false),
                    Duration = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditZones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditZones_Audits_AuditId",
                        column: x => x.AuditId,
                        principalTable: "Audits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditCriteria",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ZoneId = table.Column<int>(type: "int", nullable: false),
                    Param = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Function = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Args = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Arg1 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Arg2 = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditCriteria", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditCriteria_AuditZones_ZoneId",
                        column: x => x.ZoneId,
                        principalTable: "AuditZones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditCriteria_ZoneId",
                table: "AuditCriteria",
                column: "ZoneId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditZones_AuditId",
                table: "AuditZones",
                column: "AuditId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditCriteria");

            migrationBuilder.DropTable(
                name: "AuditZones");
        }
    }
}
