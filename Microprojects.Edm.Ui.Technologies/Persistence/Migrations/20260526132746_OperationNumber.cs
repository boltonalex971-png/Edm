using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OperationNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Number",
                table: "Operations",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            // Backfill running numbers for pre-existing rows so the unique
            // index below can be created. Ordered by Created (then Id as a
            // deterministic tiebreaker) so the earliest operation becomes "1".
            migrationBuilder.Sql(@"
                ;WITH numbered AS (
                    SELECT Id, CAST(ROW_NUMBER() OVER (ORDER BY [Created], [Id]) AS NVARCHAR(32)) AS Rn
                    FROM [Operations]
                )
                UPDATE op
                SET op.[Number] = n.Rn
                FROM [Operations] op
                JOIN numbered n ON n.Id = op.Id;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Operations_Number",
                table: "Operations",
                column: "Number",
                unique: true,
                filter: "[Number] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Operations_Number",
                table: "Operations");

            migrationBuilder.DropColumn(
                name: "Number",
                table: "Operations");
        }
    }
}
