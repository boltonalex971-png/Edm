using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optosense.Edm.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class OperationWorkplaceProcess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WorkplaceProcessId",
                table: "Operations",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Operations_WorkplaceProcessId",
                table: "Operations",
                column: "WorkplaceProcessId");

            migrationBuilder.AddForeignKey(
                name: "FK_Operations_WorkplaceProcesses_WorkplaceProcessId",
                table: "Operations",
                column: "WorkplaceProcessId",
                principalTable: "WorkplaceProcesses",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Operations_WorkplaceProcesses_WorkplaceProcessId",
                table: "Operations");

            migrationBuilder.DropIndex(
                name: "IX_Operations_WorkplaceProcessId",
                table: "Operations");

            migrationBuilder.DropColumn(
                name: "WorkplaceProcessId",
                table: "Operations");
        }
    }
}
