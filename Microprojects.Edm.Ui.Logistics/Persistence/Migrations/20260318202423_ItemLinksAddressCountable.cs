using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ItemLinksAddressCountable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Countable",
                table: "Nomenclatures",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "Address",
                table: "Items",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ItemLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderProcessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TargetItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ConsumedQuantity = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemLinks_Items_SourceItemId",
                        column: x => x.SourceItemId,
                        principalTable: "Items",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ItemLinks_Items_TargetItemId",
                        column: x => x.TargetItemId,
                        principalTable: "Items",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ItemLinks_OrderProcess_OrderProcessId",
                        column: x => x.OrderProcessId,
                        principalTable: "OrderProcess",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItemLinks_OrderProcessId",
                table: "ItemLinks",
                column: "OrderProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemLinks_SourceItemId",
                table: "ItemLinks",
                column: "SourceItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemLinks_TargetItemId",
                table: "ItemLinks",
                column: "TargetItemId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItemLinks");

            migrationBuilder.DropColumn(
                name: "Countable",
                table: "Nomenclatures");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Items");
        }
    }
}
