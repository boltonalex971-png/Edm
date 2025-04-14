using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DirectoryAndMeta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Directories_Directories_ParentId",
                table: "Directories");

            migrationBuilder.DropColumn(
                name: "EntityType",
                table: "Directories");

            migrationBuilder.DropColumn(
                name: "Group",
                table: "Directories");

            migrationBuilder.DropColumn(
                name: "IsPublic",
                table: "Directories");

            migrationBuilder.DropColumn(
                name: "ObjectId",
                table: "Directories");

            migrationBuilder.DropColumn(
                name: "Owner",
                table: "Directories");

            migrationBuilder.RenameColumn(
                name: "Timestamp",
                table: "Meta",
                newName: "Created");

            migrationBuilder.RenameColumn(
                name: "JsonValue",
                table: "Meta",
                newName: "Owner");

            migrationBuilder.RenameColumn(
                name: "ParentId",
                table: "Directories",
                newName: "DirectoryId");

            migrationBuilder.RenameIndex(
                name: "IX_Directories_ParentId",
                table: "Directories",
                newName: "IX_Directories_DirectoryId");

            migrationBuilder.AddColumn<Guid>(
                name: "DirectoryId",
                table: "TareTypes",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DirectoryId",
                table: "Processes",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DirectoryId",
                table: "NomenclatureTypes",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DirectoryId",
                table: "Nomenclatures",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Deleted",
                table: "Meta",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Groups",
                table: "Meta",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "Modified",
                table: "Meta",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "History",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MetaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    JsonValue = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Author = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_History", x => x.Id);
                    table.ForeignKey(
                        name: "FK_History_Meta_MetaId",
                        column: x => x.MetaId,
                        principalTable: "Meta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TareTypes_DirectoryId",
                table: "TareTypes",
                column: "DirectoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Processes_DirectoryId",
                table: "Processes",
                column: "DirectoryId");

            migrationBuilder.CreateIndex(
                name: "IX_NomenclatureTypes_DirectoryId",
                table: "NomenclatureTypes",
                column: "DirectoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Nomenclatures_DirectoryId",
                table: "Nomenclatures",
                column: "DirectoryId");

            migrationBuilder.CreateIndex(
                name: "IX_History_MetaId",
                table: "History",
                column: "MetaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Directories_Directories_DirectoryId",
                table: "Directories",
                column: "DirectoryId",
                principalTable: "Directories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Directories_Meta_Id",
                table: "Directories",
                column: "Id",
                principalTable: "Meta",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Nomenclatures_Directories_DirectoryId",
                table: "Nomenclatures",
                column: "DirectoryId",
                principalTable: "Directories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Nomenclatures_Meta_Id",
                table: "Nomenclatures",
                column: "Id",
                principalTable: "Meta",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_NomenclatureTypes_Directories_DirectoryId",
                table: "NomenclatureTypes",
                column: "DirectoryId",
                principalTable: "Directories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_NomenclatureTypes_Meta_Id",
                table: "NomenclatureTypes",
                column: "Id",
                principalTable: "Meta",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Processes_Directories_DirectoryId",
                table: "Processes",
                column: "DirectoryId",
                principalTable: "Directories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Processes_Meta_Id",
                table: "Processes",
                column: "Id",
                principalTable: "Meta",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TareTypes_Directories_DirectoryId",
                table: "TareTypes",
                column: "DirectoryId",
                principalTable: "Directories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TareTypes_Meta_Id",
                table: "TareTypes",
                column: "Id",
                principalTable: "Meta",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Directories_Directories_DirectoryId",
                table: "Directories");

            migrationBuilder.DropForeignKey(
                name: "FK_Directories_Meta_Id",
                table: "Directories");

            migrationBuilder.DropForeignKey(
                name: "FK_Nomenclatures_Directories_DirectoryId",
                table: "Nomenclatures");

            migrationBuilder.DropForeignKey(
                name: "FK_Nomenclatures_Meta_Id",
                table: "Nomenclatures");

            migrationBuilder.DropForeignKey(
                name: "FK_NomenclatureTypes_Directories_DirectoryId",
                table: "NomenclatureTypes");

            migrationBuilder.DropForeignKey(
                name: "FK_NomenclatureTypes_Meta_Id",
                table: "NomenclatureTypes");

            migrationBuilder.DropForeignKey(
                name: "FK_Processes_Directories_DirectoryId",
                table: "Processes");

            migrationBuilder.DropForeignKey(
                name: "FK_Processes_Meta_Id",
                table: "Processes");

            migrationBuilder.DropForeignKey(
                name: "FK_TareTypes_Directories_DirectoryId",
                table: "TareTypes");

            migrationBuilder.DropForeignKey(
                name: "FK_TareTypes_Meta_Id",
                table: "TareTypes");

            migrationBuilder.DropTable(
                name: "History");

            migrationBuilder.DropIndex(
                name: "IX_TareTypes_DirectoryId",
                table: "TareTypes");

            migrationBuilder.DropIndex(
                name: "IX_Processes_DirectoryId",
                table: "Processes");

            migrationBuilder.DropIndex(
                name: "IX_NomenclatureTypes_DirectoryId",
                table: "NomenclatureTypes");

            migrationBuilder.DropIndex(
                name: "IX_Nomenclatures_DirectoryId",
                table: "Nomenclatures");

            migrationBuilder.DropColumn(
                name: "DirectoryId",
                table: "TareTypes");

            migrationBuilder.DropColumn(
                name: "DirectoryId",
                table: "Processes");

            migrationBuilder.DropColumn(
                name: "DirectoryId",
                table: "NomenclatureTypes");

            migrationBuilder.DropColumn(
                name: "DirectoryId",
                table: "Nomenclatures");

            migrationBuilder.DropColumn(
                name: "Deleted",
                table: "Meta");

            migrationBuilder.DropColumn(
                name: "Groups",
                table: "Meta");

            migrationBuilder.DropColumn(
                name: "Modified",
                table: "Meta");

            migrationBuilder.RenameColumn(
                name: "Owner",
                table: "Meta",
                newName: "JsonValue");

            migrationBuilder.RenameColumn(
                name: "Created",
                table: "Meta",
                newName: "Timestamp");

            migrationBuilder.RenameColumn(
                name: "DirectoryId",
                table: "Directories",
                newName: "ParentId");

            migrationBuilder.RenameIndex(
                name: "IX_Directories_DirectoryId",
                table: "Directories",
                newName: "IX_Directories_ParentId");

            migrationBuilder.AddColumn<string>(
                name: "EntityType",
                table: "Directories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Group",
                table: "Directories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsPublic",
                table: "Directories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "ObjectId",
                table: "Directories",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Owner",
                table: "Directories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_Directories_Directories_ParentId",
                table: "Directories",
                column: "ParentId",
                principalTable: "Directories",
                principalColumn: "Id");
        }
    }
}
