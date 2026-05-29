using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    // Phase G destructive swap: Setting / HostDevice / WorkplaceHostDevice /
    // WorkplaceProcess / ProfilePoint flip int PK -> Guid PK (none get Meta).
    // Downstream FKs flip int->Guid: WorkplaceHostDevices.HostDeviceId,
    // OperationHostDevices.HostDeviceId, WorkbenchDeviceConfigurations.WorkplaceHostDeviceId,
    // Workbenches.WorkplaceProcessId, Operations.WorkplaceProcessId (nullable).
    public partial class EnforceNotNullAndSwitchToGuid_Junctions : Migration
    {
        // Data backfill (replaces the retired TechHierarchyBackfill tool): Setting,
        // HostDevice, WorkplaceHostDevice, WorkplaceProcess and ProfilePoint get
        // database-friendly Guids (no NEWID, none get Meta); then the remaining FK shadow
        // columns are mapped from the still-present legacy int FKs.
        private const string BackfillSql = @"
DECLARE @base bigint = CONVERT(bigint, DATEDIFF_BIG(SECOND, '2020-01-01T00:00:00', SYSUTCDATETIME()));

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.Settings WHERE NewId IS NULL)
UPDATE t SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.Settings t JOIN s ON t.Id = s.Id;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.HostDevices WHERE NewId IS NULL)
UPDATE t SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.HostDevices t JOIN s ON t.Id = s.Id;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.WorkplaceHostDevices WHERE NewId IS NULL)
UPDATE t SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.WorkplaceHostDevices t JOIN s ON t.Id = s.Id;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.WorkplaceProcesses WHERE NewId IS NULL)
UPDATE t SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.WorkplaceProcesses t JOIN s ON t.Id = s.Id;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.ProfilePoint WHERE NewId IS NULL)
UPDATE t SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.ProfilePoint t JOIN s ON t.Id = s.Id;

UPDATE w   SET NewHostDeviceId          = hd.NewId FROM dbo.WorkplaceHostDevices w JOIN dbo.HostDevices hd ON w.HostDeviceId = hd.Id;
UPDATE o   SET NewHostDeviceId          = hd.NewId FROM dbo.OperationHostDevices o JOIN dbo.HostDevices hd ON o.HostDeviceId = hd.Id;
UPDATE wdc SET NewWorkplaceHostDeviceId = whd.NewId FROM dbo.WorkbenchDeviceConfigurations wdc JOIN dbo.WorkplaceHostDevices whd ON wdc.WorkplaceHostDeviceId = whd.Id;
UPDATE wb  SET NewWorkplaceProcessId    = wp.NewId FROM dbo.Workbenches wb JOIN dbo.WorkplaceProcesses wp ON wb.WorkplaceProcessId = wp.Id;
UPDATE o   SET NewWorkplaceProcessId    = wp.NewId FROM dbo.Operations o JOIN dbo.WorkplaceProcesses wp ON o.WorkplaceProcessId = wp.Id;
";

        protected override void Up(MigrationBuilder b)
        {
            b.Sql(BackfillSql);

            // 0. Serials view is SCHEMABINDING-bound to OperationHostDevices.HostDeviceId.
            b.Sql("DROP VIEW IF EXISTS dbo.Serials;");

            // 1. Drop inbound FKs.
            b.DropForeignKey("FK_WorkplaceHostDevices_HostDevices_HostDeviceId", "WorkplaceHostDevices");
            b.DropForeignKey("FK_OperationHostDevices_HostDevices_HostDeviceId", "OperationHostDevices");
            b.DropForeignKey("FK_WorkbenchDeviceConfigurations_WorkplaceHostDevices_WorkplaceHostDeviceId", "WorkbenchDeviceConfigurations");
            b.DropForeignKey("FK_Workbenches_WorkplaceProcesses_WorkplaceProcessId", "Workbenches");
            b.DropForeignKey("FK_Operations_WorkplaceProcesses_WorkplaceProcessId", "Operations");
            b.DropForeignKey("FK_ProfilePoint_Profiles_ProfileId", "ProfilePoint");
            b.DropForeignKey("FK_WorkplaceProcesses_Workplaces_WorkplaceId", "WorkplaceProcesses");
            b.DropForeignKey("FK_WorkplaceProcesses_Processes_ProcessId", "WorkplaceProcesses");
            b.DropForeignKey("FK_WorkplaceHostDevices_Workplaces_WorkplaceId", "WorkplaceHostDevices");

            // 2. Drop indexes on int FK columns about to be dropped.
            b.DropIndex("IX_WorkplaceHostDevices_HostDeviceId", "WorkplaceHostDevices");
            b.DropIndex("IX_OperationHostDevices_HostDeviceId", "OperationHostDevices");
            b.DropIndex("IX_WorkbenchDeviceConfigurations_WorkplaceHostDeviceId", "WorkbenchDeviceConfigurations");
            b.DropIndex("IX_Workbenches_WorkplaceProcessId", "Workbenches");
            b.DropIndex("IX_Operations_WorkplaceProcessId", "Operations");
            b.DropIndex("IX_ProfilePoint_ProfileId", "ProfilePoint");
            b.DropIndex("IX_WorkplaceProcesses_WorkplaceId", "WorkplaceProcesses");
            b.DropIndex("IX_WorkplaceProcesses_ProcessId", "WorkplaceProcesses");
            b.DropIndex("IX_WorkplaceHostDevices_WorkplaceId", "WorkplaceHostDevices");

            // 3. Drop legacy columns.
            b.DropColumn("HostDeviceId", "WorkplaceHostDevices");
            b.DropColumn("HostDeviceId", "OperationHostDevices");
            b.DropColumn("WorkplaceHostDeviceId", "WorkbenchDeviceConfigurations");
            b.DropColumn("WorkplaceProcessId", "Workbenches");
            b.DropColumn("WorkplaceProcessId", "Operations");

            // 4. Drop PKs + int Id columns.
            b.DropPrimaryKey("PK_Settings", "Settings");
            b.DropColumn("Id", "Settings");
            b.DropPrimaryKey("PK_HostDevices", "HostDevices");
            b.DropColumn("Id", "HostDevices");
            b.DropPrimaryKey("PK_WorkplaceHostDevices", "WorkplaceHostDevices");
            b.DropColumn("Id", "WorkplaceHostDevices");
            b.DropPrimaryKey("PK_WorkplaceProcesses", "WorkplaceProcesses");
            b.DropColumn("Id", "WorkplaceProcesses");
            b.DropPrimaryKey("PK_ProfilePoint", "ProfilePoint");
            b.DropColumn("Id", "ProfilePoint");

            // 5. sp_rename shadow columns into canonical names.
            b.Sql("EXEC sp_rename N'dbo.Settings.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.HostDevices.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.WorkplaceHostDevices.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.WorkplaceProcesses.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.ProfilePoint.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.WorkplaceHostDevices.NewHostDeviceId', N'HostDeviceId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.OperationHostDevices.NewHostDeviceId', N'HostDeviceId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.WorkbenchDeviceConfigurations.NewWorkplaceHostDeviceId', N'WorkplaceHostDeviceId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Workbenches.NewWorkplaceProcessId', N'WorkplaceProcessId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Operations.NewWorkplaceProcessId', N'WorkplaceProcessId', N'COLUMN';");

            // 6. NOT NULL on the renamed columns. Operations.WorkplaceProcessId stays nullable.
            b.AlterColumn<Guid>("Id", "Settings", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "HostDevices", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "WorkplaceHostDevices", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "WorkplaceProcesses", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "ProfilePoint", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);

            b.AlterColumn<Guid>("HostDeviceId", "WorkplaceHostDevices", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("HostDeviceId", "OperationHostDevices", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("WorkplaceHostDeviceId", "WorkbenchDeviceConfigurations", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("WorkplaceProcessId", "Workbenches", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            // Operations.WorkplaceProcessId stays nullable.

            // 7. Recreate PKs.
            b.AddPrimaryKey("PK_Settings", "Settings", "Id");
            b.AddPrimaryKey("PK_HostDevices", "HostDevices", "Id");
            b.AddPrimaryKey("PK_WorkplaceHostDevices", "WorkplaceHostDevices", "Id");
            b.AddPrimaryKey("PK_WorkplaceProcesses", "WorkplaceProcesses", "Id");
            b.AddPrimaryKey("PK_ProfilePoint", "ProfilePoint", "Id");

            // 8. Recreate indexes on Guid FK columns.
            b.CreateIndex("IX_WorkplaceHostDevices_HostDeviceId", "WorkplaceHostDevices", "HostDeviceId");
            b.CreateIndex("IX_OperationHostDevices_HostDeviceId", "OperationHostDevices", "HostDeviceId");
            b.CreateIndex("IX_WorkbenchDeviceConfigurations_WorkplaceHostDeviceId", "WorkbenchDeviceConfigurations", "WorkplaceHostDeviceId");
            b.CreateIndex("IX_Workbenches_WorkplaceProcessId", "Workbenches", "WorkplaceProcessId");
            b.CreateIndex("IX_Operations_WorkplaceProcessId", "Operations", "WorkplaceProcessId");
            b.CreateIndex("IX_ProfilePoint_ProfileId", "ProfilePoint", "ProfileId");
            b.CreateIndex("IX_WorkplaceProcesses_WorkplaceId", "WorkplaceProcesses", "WorkplaceId");
            b.CreateIndex("IX_WorkplaceProcesses_ProcessId", "WorkplaceProcesses", "ProcessId");
            b.CreateIndex("IX_WorkplaceHostDevices_WorkplaceId", "WorkplaceHostDevices", "WorkplaceId");

            // 9. Recreate FKs (NoAction).
            b.AddForeignKey("FK_WorkplaceHostDevices_HostDevices_HostDeviceId", "WorkplaceHostDevices",
                "HostDeviceId", "HostDevices", principalColumn: "Id");
            b.AddForeignKey("FK_OperationHostDevices_HostDevices_HostDeviceId", "OperationHostDevices",
                "HostDeviceId", "HostDevices", principalColumn: "Id");
            b.AddForeignKey("FK_WorkbenchDeviceConfigurations_WorkplaceHostDevices_WorkplaceHostDeviceId", "WorkbenchDeviceConfigurations",
                "WorkplaceHostDeviceId", "WorkplaceHostDevices", principalColumn: "Id");
            b.AddForeignKey("FK_Workbenches_WorkplaceProcesses_WorkplaceProcessId", "Workbenches",
                "WorkplaceProcessId", "WorkplaceProcesses", principalColumn: "Id");
            b.AddForeignKey("FK_Operations_WorkplaceProcesses_WorkplaceProcessId", "Operations",
                "WorkplaceProcessId", "WorkplaceProcesses", principalColumn: "Id");
            b.AddForeignKey("FK_ProfilePoint_Profiles_ProfileId", "ProfilePoint",
                "ProfileId", "Profiles", principalColumn: "Id");
            b.AddForeignKey("FK_WorkplaceProcesses_Workplaces_WorkplaceId", "WorkplaceProcesses",
                "WorkplaceId", "Workplaces", principalColumn: "Id");
            b.AddForeignKey("FK_WorkplaceProcesses_Processes_ProcessId", "WorkplaceProcesses",
                "ProcessId", "Processes", principalColumn: "Id");
            b.AddForeignKey("FK_WorkplaceHostDevices_Workplaces_WorkplaceId", "WorkplaceHostDevices",
                "WorkplaceId", "Workplaces", principalColumn: "Id");

            // 10. Recreate the Serials view against the now-Guid columns.
            b.Sql(@"
create view dbo.Serials
WITH SCHEMABINDING
AS
SELECT
    r.Id,
    r.OperationHostDeviceId,
    o.HostDeviceId, o.OperationId,
    JSON_VALUE(r.Parameters, '$.Sn') as Sn,
    JSON_VALUE(r.Parameters, '$.ADDR') as Addr,
    JSON_VALUE(r.Parameters, '$.Signal') as Signal,
    JSON_VALUE(r.Parameters, '$.Ref') as Ref
from dbo.Records r
join dbo.OperationHostDevices o on o.Id = r.OperationHostDeviceId
where JSON_VALUE(r.Parameters, '$.Sn') IS NOT NULL;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("RAISERROR(N'Phase G migration is one-way; restore from backup to roll back.', 16, 1);");
        }
    }
}
