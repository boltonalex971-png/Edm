using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optosense.Edm.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class OperationWorkbenchNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Operations_Workbenches_WorkbenchId",
                table: "Operations");

            migrationBuilder.AlterColumn<int>(
                name: "WorkbenchId",
                table: "Operations",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Operations_Workbenches_WorkbenchId",
                table: "Operations",
                column: "WorkbenchId",
                principalTable: "Workbenches",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Operations_Workbenches_WorkbenchId",
                table: "Operations");

            migrationBuilder.AlterColumn<int>(
                name: "WorkbenchId",
                table: "Operations",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Operations_Workbenches_WorkbenchId",
                table: "Operations",
                column: "WorkbenchId",
                principalTable: "Workbenches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
