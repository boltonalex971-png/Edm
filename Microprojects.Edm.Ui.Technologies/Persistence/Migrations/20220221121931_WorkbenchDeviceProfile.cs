using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    public partial class WorkbenchDeviceProfile : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // TODO Create dumb profile with id 0 to apply migration successfully
            migrationBuilder.AddColumn<int>(
                name: "ProfileId",
                table: "WorkbenchDeviceConfigurations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_WorkbenchDeviceConfigurations_ProfileId",
                table: "WorkbenchDeviceConfigurations",
                column: "ProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkbenchDeviceConfigurations_Profiles_ProfileId",
                table: "WorkbenchDeviceConfigurations",
                column: "ProfileId",
                principalTable: "Profiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkbenchDeviceConfigurations_Profiles_ProfileId",
                table: "WorkbenchDeviceConfigurations");

            migrationBuilder.DropIndex(
                name: "IX_WorkbenchDeviceConfigurations_ProfileId",
                table: "WorkbenchDeviceConfigurations");

            migrationBuilder.DropColumn(
                name: "ProfileId",
                table: "WorkbenchDeviceConfigurations");
        }
    }
}
