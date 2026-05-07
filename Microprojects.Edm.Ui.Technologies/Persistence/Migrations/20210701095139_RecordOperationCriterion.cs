using Microsoft.EntityFrameworkCore.Migrations;

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    public partial class RecordOperationCriterion : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OperationCriteria",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OperationId = table.Column<int>(type: "int", nullable: false),
                    AuditCriterionId = table.Column<int>(type: "int", nullable: false),
                    Valid = table.Column<bool>(type: "bit", nullable: false),
                    Result = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OperationCriteria", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OperationCriteria_AuditCriteria_AuditCriterionId",
                        column: x => x.AuditCriterionId,
                        principalTable: "AuditCriteria",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OperationCriteria_Operations_OperationId",
                        column: x => x.OperationId,
                        principalTable: "Operations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RecordOperationCriteria",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecordId = table.Column<int>(type: "int", nullable: false),
                    OperationCriterionId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecordOperationCriteria", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecordOperationCriteria_OperationCriteria_OperationCriterionId",
                        column: x => x.OperationCriterionId,
                        principalTable: "OperationCriteria",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RecordOperationCriteria_Records_RecordId",
                        column: x => x.RecordId,
                        principalTable: "Records",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OperationCriteria_AuditCriterionId",
                table: "OperationCriteria",
                column: "AuditCriterionId");

            migrationBuilder.CreateIndex(
                name: "IX_OperationCriteria_OperationId",
                table: "OperationCriteria",
                column: "OperationId");

            migrationBuilder.CreateIndex(
                name: "IX_RecordOperationCriteria_OperationCriterionId",
                table: "RecordOperationCriteria",
                column: "OperationCriterionId");

            migrationBuilder.CreateIndex(
                name: "IX_RecordOperationCriteria_RecordId",
                table: "RecordOperationCriteria",
                column: "RecordId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RecordOperationCriteria");

            migrationBuilder.DropTable(
                name: "OperationCriteria");
        }
    }
}
