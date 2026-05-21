using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CreateDirectoriesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Directories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DirectoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Directories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Directories_Directories_DirectoryId",
                        column: x => x.DirectoryId,
                        principalTable: "Directories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Directories_Meta_Id",
                        column: x => x.Id,
                        principalTable: "Meta",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Directories_DirectoryId",
                table: "Directories",
                column: "DirectoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Directories");
        }
    }
}
