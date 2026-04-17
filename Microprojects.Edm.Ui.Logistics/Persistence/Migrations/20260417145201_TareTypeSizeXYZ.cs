using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class TareTypeSizeXYZ : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SizeX",
                table: "TareTypes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SizeY",
                table: "TareTypes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SizeZ",
                table: "TareTypes",
                type: "int",
                nullable: true);

            // Migrate existing dimensional data into size columns
            migrationBuilder.Sql("""
                                 UPDATE TareTypes
                                 SET SizeX = CAST(Capacity AS int)
                                 WHERE Countable = 1 AND Dimensions = 1;

                                 UPDATE TareTypes
                                 SET SizeX = CEILING(SQRT(Capacity)),
                                     SizeY = CEILING(Capacity / CEILING(SQRT(Capacity)))
                                 WHERE Countable = 1 AND Dimensions >= 2;
                                 """);

            migrationBuilder.DropColumn(
                name: "Dimensions",
                table: "TareTypes");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Dimensions",
                table: "TareTypes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("""
                                 UPDATE TareTypes SET Dimensions = 0;
                                 UPDATE TareTypes SET Dimensions = 1 WHERE SizeX IS NOT NULL AND SizeX > 0;
                                 UPDATE TareTypes SET Dimensions = 2 WHERE SizeY IS NOT NULL AND SizeY > 0;
                                 UPDATE TareTypes SET Dimensions = 3 WHERE SizeZ IS NOT NULL AND SizeZ > 0;
                                 """);

            migrationBuilder.DropColumn(
                name: "SizeX",
                table: "TareTypes");

            migrationBuilder.DropColumn(
                name: "SizeY",
                table: "TareTypes");

            migrationBuilder.DropColumn(
                name: "SizeZ",
                table: "TareTypes");

        }
    }
}