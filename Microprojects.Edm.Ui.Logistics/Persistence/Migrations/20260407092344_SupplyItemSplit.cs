using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SupplyItemSplit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SupplyId",
                table: "Items",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Supplies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Shipment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ShipmentExternalId = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Supplies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Supplies_Meta_Id",
                        column: x => x.Id,
                        principalTable: "Meta",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Items_SupplyId",
                table: "Items",
                column: "SupplyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Items_Supplies_SupplyId",
                table: "Items",
                column: "SupplyId",
                principalTable: "Supplies",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Items_Supplies_SupplyId",
                table: "Items");

            migrationBuilder.DropTable(
                name: "Supplies");

            migrationBuilder.DropIndex(
                name: "IX_Items_SupplyId",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "SupplyId",
                table: "Items");
        }
    }
}
