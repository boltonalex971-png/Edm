using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ItemWithMeta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("INSERT INTO dbo.Meta (Id, Metatype, Created, Owner) SELECT Id, 'Item', GETDATE(), 'User' FROM dbo.Items");
            migrationBuilder.AddForeignKey(
                name: "FK_Items_Meta_Id",
                table: "Items",
                column: "Id",
                principalTable: "Meta",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Items_Meta_Id",
                table: "Items");
        }
    }
}
