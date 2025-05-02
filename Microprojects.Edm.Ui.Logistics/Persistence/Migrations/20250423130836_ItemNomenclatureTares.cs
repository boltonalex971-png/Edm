using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ItemNomenclatureTares : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NomenclatureTypes");

            migrationBuilder.AddColumn<Guid>(
                name: "DefaultTareTypeId",
                table: "Nomenclatures",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Shipment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ShipmentExternalId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SerialNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Barcode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    NomenclatureId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TareId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OriginId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Items_Items_OriginId",
                        column: x => x.OriginId,
                        principalTable: "Items",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Items_Nomenclatures_NomenclatureId",
                        column: x => x.NomenclatureId,
                        principalTable: "Nomenclatures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Items_Tares_TareId",
                        column: x => x.TareId,
                        principalTable: "Tares",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Nomenclatures_DefaultTareTypeId",
                table: "Nomenclatures",
                column: "DefaultTareTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Items_NomenclatureId",
                table: "Items",
                column: "NomenclatureId");

            migrationBuilder.CreateIndex(
                name: "IX_Items_OriginId",
                table: "Items",
                column: "OriginId");

            migrationBuilder.CreateIndex(
                name: "IX_Items_TareId",
                table: "Items",
                column: "TareId");

            migrationBuilder.AddForeignKey(
                name: "FK_Nomenclatures_TareTypes_DefaultTareTypeId",
                table: "Nomenclatures",
                column: "DefaultTareTypeId",
                principalTable: "TareTypes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Nomenclatures_TareTypes_DefaultTareTypeId",
                table: "Nomenclatures");

            migrationBuilder.DropTable(
                name: "Items");

            migrationBuilder.DropIndex(
                name: "IX_Nomenclatures_DefaultTareTypeId",
                table: "Nomenclatures");

            migrationBuilder.DropColumn(
                name: "DefaultTareTypeId",
                table: "Nomenclatures");

            migrationBuilder.CreateTable(
                name: "NomenclatureTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DirectoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TareTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NomenclatureTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NomenclatureTypes_Directories_DirectoryId",
                        column: x => x.DirectoryId,
                        principalTable: "Directories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_NomenclatureTypes_Meta_Id",
                        column: x => x.Id,
                        principalTable: "Meta",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_NomenclatureTypes_TareTypes_TareTypeId",
                        column: x => x.TareTypeId,
                        principalTable: "TareTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NomenclatureTypes_DirectoryId",
                table: "NomenclatureTypes",
                column: "DirectoryId");

            migrationBuilder.CreateIndex(
                name: "IX_NomenclatureTypes_TareTypeId",
                table: "NomenclatureTypes",
                column: "TareTypeId");
        }
    }
}
