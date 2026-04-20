using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DropOriginIdAndNullableLinkProcess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "OrderProcessId",
                table: "ItemLinks",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            // 1) Backfill existing Item.OriginId lineage into ItemLinks so the new
            //    genealogy feature can show historical splits/allocations. The
            //    backfilled edges have OrderProcessId = NULL (non-execution).
            migrationBuilder.Sql(@"
                INSERT INTO ItemLinks (Id, SourceItemId, TargetItemId, OrderProcessId, ConsumedQuantity)
                SELECT NEWID(), i.OriginId, i.Id, NULL, i.Quantity
                FROM Items i
                WHERE i.OriginId IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM ItemLinks l
                      WHERE l.SourceItemId = i.OriginId AND l.TargetItemId = i.Id
                  );
            ");

            migrationBuilder.DropForeignKey(
                name: "FK_Items_Items_OriginId",
                table: "Items");

            migrationBuilder.DropIndex(
                name: "IX_Items_OriginId",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "OriginId",
                table: "Items");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert ItemLinks.OrderProcessId to NOT NULL. Any repack/allocation
            // rows with NULL OrderProcessId must be removed first.
            migrationBuilder.Sql("DELETE FROM ItemLinks WHERE OrderProcessId IS NULL;");

            migrationBuilder.AddColumn<Guid>(
                name: "OriginId",
                table: "Items",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "OrderProcessId",
                table: "ItemLinks",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Items_OriginId",
                table: "Items",
                column: "OriginId");

            migrationBuilder.AddForeignKey(
                name: "FK_Items_Items_OriginId",
                table: "Items",
                column: "OriginId",
                principalTable: "Items",
                principalColumn: "Id");
        }
    }
}
