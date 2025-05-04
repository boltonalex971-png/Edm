using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SpecificationProcess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Unit",
                table: "TareTypes",
                newName: "Units");

            migrationBuilder.AddColumn<bool>(
                name: "Active",
                table: "Specifications",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Specifications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DirectoryId",
                table: "Specifications",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Specifications",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "ProcessId",
                table: "Specifications",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<double>(
                name: "Quantity",
                table: "SpecificationNomenclatures",
                type: "float",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<double>(
                name: "Quantity",
                table: "Items",
                type: "float",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateIndex(
                name: "IX_Specifications_DirectoryId",
                table: "Specifications",
                column: "DirectoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Specifications_ProcessId",
                table: "Specifications",
                column: "ProcessId");

            migrationBuilder.AddForeignKey(
                name: "FK_Specifications_Directories_DirectoryId",
                table: "Specifications",
                column: "DirectoryId",
                principalTable: "Directories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Specifications_Meta_Id",
                table: "Specifications",
                column: "Id",
                principalTable: "Meta",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Specifications_Processes_ProcessId",
                table: "Specifications",
                column: "ProcessId",
                principalTable: "Processes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Specifications_Directories_DirectoryId",
                table: "Specifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Specifications_Meta_Id",
                table: "Specifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Specifications_Processes_ProcessId",
                table: "Specifications");

            migrationBuilder.DropIndex(
                name: "IX_Specifications_DirectoryId",
                table: "Specifications");

            migrationBuilder.DropIndex(
                name: "IX_Specifications_ProcessId",
                table: "Specifications");

            migrationBuilder.DropColumn(
                name: "Active",
                table: "Specifications");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Specifications");

            migrationBuilder.DropColumn(
                name: "DirectoryId",
                table: "Specifications");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Specifications");

            migrationBuilder.DropColumn(
                name: "ProcessId",
                table: "Specifications");

            migrationBuilder.RenameColumn(
                name: "Units",
                table: "TareTypes",
                newName: "Unit");

            migrationBuilder.AlterColumn<int>(
                name: "Quantity",
                table: "SpecificationNomenclatures",
                type: "int",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "float");

            migrationBuilder.AlterColumn<int>(
                name: "Quantity",
                table: "Items",
                type: "int",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "float");
        }
    }
}
