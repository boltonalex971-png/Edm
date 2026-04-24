using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Optosense.Edm.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class SyncParametersConverter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Snapshot-sync only: removed the legacy HasColumnType("jsonb")
            // from EdmContext; SQL Server's actual Records.Parameters column is
            // already nvarchar(max). No DDL needed.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
