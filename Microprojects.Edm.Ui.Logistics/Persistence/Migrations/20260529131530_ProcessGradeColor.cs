using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProcessGradeColor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Grades",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "#7dd3fc");

            // Backfill existing grades with varied palette colors (round-robin
            // over a 12-hue pastel set) so they don't all share the default.
            migrationBuilder.Sql(
                """
                WITH numbered AS (
                    SELECT Id, (ROW_NUMBER() OVER (ORDER BY Id) - 1) % 12 AS slot
                    FROM Grades
                )
                UPDATE g
                SET Color = CASE n.slot
                    WHEN 0  THEN '#fca5a5'
                    WHEN 1  THEN '#fdba74'
                    WHEN 2  THEN '#fde68a'
                    WHEN 3  THEN '#bef264'
                    WHEN 4  THEN '#86efac'
                    WHEN 5  THEN '#5eead4'
                    WHEN 6  THEN '#7dd3fc'
                    WHEN 7  THEN '#a5b4fc'
                    WHEN 8  THEN '#d8b4fe'
                    WHEN 9  THEN '#f9a8d4'
                    WHEN 10 THEN '#fecaca'
                    ELSE         '#fed7aa'
                END
                FROM Grades g
                INNER JOIN numbered n ON n.Id = g.Id;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Color",
                table: "Grades");
        }
    }
}
