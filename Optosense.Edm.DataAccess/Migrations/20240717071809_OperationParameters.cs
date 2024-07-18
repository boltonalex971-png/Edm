using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optosense.Edm.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class OperationParameters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Parameters",
                table: "Operations",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Parameters",
                table: "Operations");
        }
    }
}
