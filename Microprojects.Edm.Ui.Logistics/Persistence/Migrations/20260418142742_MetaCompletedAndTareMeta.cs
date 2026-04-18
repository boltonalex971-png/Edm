using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MetaCompletedAndTareMeta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "Completed",
                table: "Meta",
                type: "datetime2",
                nullable: true);

            // Backfill Meta rows for existing Tares so the new FK can be added.
            migrationBuilder.Sql(@"
                INSERT INTO Meta (Id, Metatype, Owner, Groups, Created, Modified, Deleted, Completed)
                SELECT t.Id, 'Tare', '?', '[]', SYSUTCDATETIME(), NULL, NULL, NULL
                FROM Tares t
                WHERE NOT EXISTS (SELECT 1 FROM Meta m WHERE m.Id = t.Id);
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_Tares_Meta_Id",
                table: "Tares",
                column: "Id",
                principalTable: "Meta",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tares_Meta_Id",
                table: "Tares");

            migrationBuilder.DropColumn(
                name: "Completed",
                table: "Meta");
        }
    }
}
