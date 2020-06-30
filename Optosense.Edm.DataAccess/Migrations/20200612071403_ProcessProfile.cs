using Microsoft.EntityFrameworkCore.Migrations;

namespace Optosense.Edm.DataAccess.Migrations
{
    public partial class ProcessProfile : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Profiles",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Profiles",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Model",
                table: "Profiles",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TextJson",
                table: "Profiles",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProcessProfile",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProcessId = table.Column<int>(nullable: false),
                    ProfileId = table.Column<int>(nullable: false)
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

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcessProfile");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "Model",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "TextJson",
                table: "Profiles");
        }
    }
}
