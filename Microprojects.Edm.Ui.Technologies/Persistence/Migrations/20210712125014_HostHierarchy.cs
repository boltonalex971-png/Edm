using Microsoft.EntityFrameworkCore.Migrations;

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    public partial class HostHierarchy : Migration
    {
        // Legacy enum values from the deleted HierarchyType:
        //   Any=0, Process=1, Workplace=2, Host=3, Device=4
        // Inlined as literals so this historical migration keeps compiling
        // after the enum class was deleted in Phase C of the directory
        // unification work.
        private const int HierarchyTypeAny = 0;
        private const int HierarchyTypeProcess = 1;
        private const int HierarchyTypeWorkplace = 2;
        private const int HierarchyTypeHost = 3;
        private const int HierarchyTypeDevice = 4;

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HierarchyId",
                table: "Hosts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Hierarchies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ParentId = table.Column<int>(type: "int", nullable: true),
                    Type = table.Column<int>(type: "int", nullable: false),
                    IsPublic = table.Column<bool>(type: "bit", nullable: false),
                    Owner = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Group = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hierarchies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Hierarchies_Hierarchies_ParentId",
                        column: x => x.ParentId,
                        principalTable: "Hierarchies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });


            migrationBuilder.Sql("SET IDENTITY_INSERT dbo.Hierarchies ON");
            migrationBuilder.Sql($"INSERT INTO dbo.Hierarchies (Id, ParentId, Type, IsPublic, IsActive, Name, Description) VALUES (0, NULL, {HierarchyTypeAny}, 1, 1, 'Root', 'Global hierarchy root node' )");
            migrationBuilder.Sql($"INSERT INTO dbo.Hierarchies (Id, ParentId, Type, IsPublic, IsActive, Name, Description) VALUES (1, 0, {HierarchyTypeHost}, 1, 1, 'Hosts', 'Hosts root node' )");
            migrationBuilder.Sql($"INSERT INTO dbo.Hierarchies (Id, ParentId, Type, IsPublic, IsActive, Name, Description) VALUES (2, 0, {HierarchyTypeDevice}, 1, 1, 'Devices', 'Devices root node' )");
            migrationBuilder.Sql($"INSERT INTO dbo.Hierarchies (Id, ParentId, Type, IsPublic, IsActive, Name, Description) VALUES (3, 0, {HierarchyTypeProcess}, 1, 1, 'Processes', 'Processes root node' )");
            migrationBuilder.Sql($"INSERT INTO dbo.Hierarchies (Id, ParentId, Type, IsPublic, IsActive, Name, Description) VALUES (4, 0, {HierarchyTypeWorkplace}, 1, 1, 'Workplaces', 'Workplaces root node' )");
            migrationBuilder.Sql("SET IDENTITY_INSERT dbo.Hierarchies OFF");

            migrationBuilder.CreateIndex(
                name: "IX_Hosts_HierarchyId",
                table: "Hosts",
                column: "HierarchyId");

            migrationBuilder.CreateIndex(
                name: "IX_Hierarchies_ParentId",
                table: "Hierarchies",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Hosts_Hierarchies_HierarchyId",
                table: "Hosts",
                column: "HierarchyId",
                principalTable: "Hierarchies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.Sql("UPDATE dbo.Hosts SET HierarchyId=1");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Hosts_Hierarchies_HierarchyId",
                table: "Hosts");

            migrationBuilder.DropTable(
                name: "Hierarchies");

            migrationBuilder.DropIndex(
                name: "IX_Hosts_HierarchyId",
                table: "Hosts");

            migrationBuilder.DropColumn(
                name: "HierarchyId",
                table: "Hosts");
        }
    }
}
