using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProcessNomenclature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "NomenclatureId",
                table: "Processes",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Processes_NomenclatureId",
                table: "Processes",
                column: "NomenclatureId");

            migrationBuilder.AddForeignKey(
                name: "FK_Processes_Nomenclatures_NomenclatureId",
                table: "Processes",
                column: "NomenclatureId",
                principalTable: "Nomenclatures",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Processes_Nomenclatures_NomenclatureId",
                table: "Processes");

            migrationBuilder.DropIndex(
                name: "IX_Processes_NomenclatureId",
                table: "Processes");

            migrationBuilder.DropColumn(
                name: "NomenclatureId",
                table: "Processes");
        }
    }
}
