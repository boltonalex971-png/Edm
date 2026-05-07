using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Qualifiers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Qualifier",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProcessId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Qualifier", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Qualifier_Processes_ProcessId",
                        column: x => x.ProcessId,
                        principalTable: "Processes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditQualifier",
                columns: table => new
                {
                    AuditId = table.Column<int>(type: "int", nullable: false),
                    QualifiersId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditQualifier", x => new { x.AuditId, x.QualifiersId });
                    table.ForeignKey(
                        name: "FK_AuditQualifier_Audits_AuditId",
                        column: x => x.AuditId,
                        principalTable: "Audits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AuditQualifier_Qualifier_QualifiersId",
                        column: x => x.QualifiersId,
                        principalTable: "Qualifier",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditQualifier_QualifiersId",
                table: "AuditQualifier",
                column: "QualifiersId");

            migrationBuilder.CreateIndex(
                name: "IX_Qualifier_ProcessId",
                table: "Qualifier",
                column: "ProcessId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditQualifier");

            migrationBuilder.DropTable(
                name: "Qualifier");
        }
    }
}
