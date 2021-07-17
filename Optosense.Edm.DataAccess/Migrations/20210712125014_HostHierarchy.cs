using Microsoft.EntityFrameworkCore.Migrations;
using Optosense.Edm.Domain.Models;

namespace Optosense.Edm.DataAccess.Migrations
{
    public partial class HostHierarchy : Migration
    {
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
            migrationBuilder.Sql($"INSERT INTO dbo.Hierarchies (Id, ParentId, Type, IsPublic, IsActive, Name, Description) VALUES (0, NULL, {(int)HierarchyType.Any}, 1, 1, 'Root', 'Global hierarchy root node' )");
            migrationBuilder.Sql($"INSERT INTO dbo.Hierarchies (Id, ParentId, Type, IsPublic, IsActive, Name, Description) VALUES (1, 0, {(int)HierarchyType.Host}, 1, 1, 'Hosts', 'Hosts root node' )");
            migrationBuilder.Sql($"INSERT INTO dbo.Hierarchies (Id, ParentId, Type, IsPublic, IsActive, Name, Description) VALUES (2, 0, {(int)HierarchyType.Device}, 1, 1, 'Devices', 'Devices root node' )");
            migrationBuilder.Sql($"INSERT INTO dbo.Hierarchies (Id, ParentId, Type, IsPublic, IsActive, Name, Description) VALUES (3, 0, {(int)HierarchyType.Process}, 1, 1, 'Processes', 'Processes root node' )");
            migrationBuilder.Sql($"INSERT INTO dbo.Hierarchies (Id, ParentId, Type, IsPublic, IsActive, Name, Description) VALUES (4, 0, {(int)HierarchyType.Workplace}, 1, 1, 'Workplaces', 'Workplaces root node' )");
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
