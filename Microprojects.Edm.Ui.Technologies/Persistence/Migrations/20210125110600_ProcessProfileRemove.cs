using Microsoft.EntityFrameworkCore.Migrations;

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    public partial class ProcessProfileRemove : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcessProfile");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProcessProfile",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProcessId = table.Column<int>(type: "int", nullable: false),
                    ProfileId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessProfile", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessProfile_Processes_ProcessId",
                        column: x => x.ProcessId,
                        principalTable: "Processes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProcessProfile_Profiles_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProcessProfile_ProcessId",
                table: "ProcessProfile",
                column: "ProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessProfile_ProfileId",
                table: "ProcessProfile",
                column: "ProfileId");
        }
    }
}
