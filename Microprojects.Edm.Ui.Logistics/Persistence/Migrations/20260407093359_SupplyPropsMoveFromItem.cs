using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SupplyPropsMoveFromItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Barcode",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "Shipment",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "ShipmentExternalId",
                table: "Items");

            migrationBuilder.AddColumn<string>(
                name: "Barcode",
                table: "Supplies",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Barcode",
                table: "Supplies");

            migrationBuilder.AddColumn<string>(
                name: "Barcode",
                table: "Items",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Shipment",
                table: "Items",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShipmentExternalId",
                table: "Items",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
