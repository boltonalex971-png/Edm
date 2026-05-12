using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OrderSpecificationSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OrderSpecificationNomenclatures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NomenclatureId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProcessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Quantity = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderSpecificationNomenclatures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderSpecificationNomenclatures_Nomenclatures_NomenclatureId",
                        column: x => x.NomenclatureId,
                        principalTable: "Nomenclatures",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_OrderSpecificationNomenclatures_Order_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Order",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_OrderSpecificationNomenclatures_Processes_ProcessId",
                        column: x => x.ProcessId,
                        principalTable: "Processes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderSpecificationNomenclatures_NomenclatureId",
                table: "OrderSpecificationNomenclatures",
                column: "NomenclatureId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderSpecificationNomenclatures_OrderId_NomenclatureId",
                table: "OrderSpecificationNomenclatures",
                columns: new[] { "OrderId", "NomenclatureId" });

            migrationBuilder.CreateIndex(
                name: "IX_OrderSpecificationNomenclatures_ProcessId",
                table: "OrderSpecificationNomenclatures",
                column: "ProcessId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderSpecificationNomenclatures");
        }
    }
}
