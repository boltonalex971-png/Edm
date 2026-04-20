using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ItemGradeFK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GradeId",
                table: "Items",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Items_GradeId",
                table: "Items",
                column: "GradeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Items_Grades_GradeId",
                table: "Items",
                column: "GradeId",
                principalTable: "Grades",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Items_Grades_GradeId",
                table: "Items");

            migrationBuilder.DropIndex(
                name: "IX_Items_GradeId",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "GradeId",
                table: "Items");
        }
    }
}
