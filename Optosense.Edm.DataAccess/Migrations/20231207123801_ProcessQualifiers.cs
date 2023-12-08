using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optosense.Edm.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class ProcessQualifiers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuditQualifier_Qualifier_QualifiersId",
                table: "AuditQualifier");

            migrationBuilder.DropForeignKey(
                name: "FK_Qualifier_Processes_ProcessId",
                table: "Qualifier");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Qualifier",
                table: "Qualifier");

            migrationBuilder.RenameTable(
                name: "Qualifier",
                newName: "Qualifiers");

            migrationBuilder.RenameIndex(
                name: "IX_Qualifier_ProcessId",
                table: "Qualifiers",
                newName: "IX_Qualifiers_ProcessId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Qualifiers",
                table: "Qualifiers",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AuditQualifier_Qualifiers_QualifiersId",
                table: "AuditQualifier",
                column: "QualifiersId",
                principalTable: "Qualifiers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Qualifiers_Processes_ProcessId",
                table: "Qualifiers",
                column: "ProcessId",
                principalTable: "Processes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuditQualifier_Qualifiers_QualifiersId",
                table: "AuditQualifier");

            migrationBuilder.DropForeignKey(
                name: "FK_Qualifiers_Processes_ProcessId",
                table: "Qualifiers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Qualifiers",
                table: "Qualifiers");

            migrationBuilder.RenameTable(
                name: "Qualifiers",
                newName: "Qualifier");

            migrationBuilder.RenameIndex(
                name: "IX_Qualifiers_ProcessId",
                table: "Qualifier",
                newName: "IX_Qualifier_ProcessId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Qualifier",
                table: "Qualifier",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AuditQualifier_Qualifier_QualifiersId",
                table: "AuditQualifier",
                column: "QualifiersId",
                principalTable: "Qualifier",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Qualifier_Processes_ProcessId",
                table: "Qualifier",
                column: "ProcessId",
                principalTable: "Processes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
