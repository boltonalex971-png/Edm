using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NomenclatureAllowedTareTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NomenclatureTareTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NomenclatureId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TareTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NomenclatureTareTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NomenclatureTareTypes_Nomenclatures_NomenclatureId",
                        column: x => x.NomenclatureId,
                        principalTable: "Nomenclatures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NomenclatureTareTypes_TareTypes_TareTypeId",
                        column: x => x.TareTypeId,
                        principalTable: "TareTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NomenclatureTareTypes_NomenclatureId_TareTypeId",
                table: "NomenclatureTareTypes",
                columns: new[] { "NomenclatureId", "TareTypeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NomenclatureTareTypes_TareTypeId",
                table: "NomenclatureTareTypes",
                column: "TareTypeId");

            migrationBuilder.Sql("UPDATE Nomenclatures SET DefaultTareTypeId = NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NomenclatureTareTypes");
        }
    }
}
