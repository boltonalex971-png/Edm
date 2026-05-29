using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    // Phase F destructive swap: Operation, Record, Workbench flip int Id -> Guid
    // Id and join the IWithMeta family. OperationCriterion, OperationHostDevice,
    // WorkbenchDeviceConfigurations, RecordOperationCriteria flip int PK ->
    // Guid PK but stay non-Meta. Downstream FKs flip int->Guid:
    //   - Records.OperationHostDeviceId
    //   - OperationCriteria.OperationId
    //   - OperationHostDevices.OperationId
    //   - WorkbenchDeviceConfigurations.WorkbenchId
    //   - RecordOperationCriteria.RecordId, .OperationCriterionId
    //   - Operations.WorkbenchId (nullable)
    public partial class EnforceNotNullAndSwitchToGuid_Operation : Migration
    {
        // Data backfill (replaces the retired TechHierarchyBackfill tool): Operation and
        // Workbench get database-friendly Guids (no NEWID) + Meta rows; Record,
        // OperationCriterion, OperationHostDevice, WorkbenchDeviceConfiguration and
        // RecordOperationCriteria get Guids (no Meta); then FK shadow columns are mapped.
        // Operations/Workbenches have no legacy IsActive, so Meta.Deleted stays NULL.
        private const string BackfillSql = @"
DECLARE @base bigint = CONVERT(bigint, DATEDIFF_BIG(SECOND, '2020-01-01T00:00:00', SYSUTCDATETIME()));
DECLARE @now datetime2 = SYSUTCDATETIME();

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.Operations WHERE NewId IS NULL)
UPDATE o SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.Operations o JOIN s ON o.Id = s.Id;
INSERT INTO dbo.Meta (Id, Metatype, Owner, Groups, Created) SELECT NewId, N'Operation', N'', N'[]', @now FROM dbo.Operations;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.Workbenches WHERE NewId IS NULL)
UPDATE w SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.Workbenches w JOIN s ON w.Id = s.Id;
INSERT INTO dbo.Meta (Id, Metatype, Owner, Groups, Created) SELECT NewId, N'Workbench', N'', N'[]', @now FROM dbo.Workbenches;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.Records WHERE NewId IS NULL)
UPDATE r SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.Records r JOIN s ON r.Id = s.Id;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.OperationCriteria WHERE NewId IS NULL)
UPDATE c SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.OperationCriteria c JOIN s ON c.Id = s.Id;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.OperationHostDevices WHERE NewId IS NULL)
UPDATE o SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.OperationHostDevices o JOIN s ON o.Id = s.Id;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.WorkbenchDeviceConfigurations WHERE NewId IS NULL)
UPDATE w SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.WorkbenchDeviceConfigurations w JOIN s ON w.Id = s.Id;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.RecordOperationCriteria WHERE NewId IS NULL)
UPDATE r SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.RecordOperationCriteria r JOIN s ON r.Id = s.Id;

UPDATE o  SET NewWorkbenchId        = w.NewId FROM dbo.Operations o JOIN dbo.Workbenches w ON o.WorkbenchId = w.Id;
UPDATE r  SET NewOperationHostDeviceId = ohd.NewId FROM dbo.Records r JOIN dbo.OperationHostDevices ohd ON r.OperationHostDeviceId = ohd.Id;
UPDATE c  SET NewOperationId        = o.NewId FROM dbo.OperationCriteria c JOIN dbo.Operations o ON c.OperationId = o.Id;
UPDATE ohd SET NewOperationId       = o.NewId FROM dbo.OperationHostDevices ohd JOIN dbo.Operations o ON ohd.OperationId = o.Id;
UPDATE w  SET NewWorkbenchId        = wb.NewId FROM dbo.WorkbenchDeviceConfigurations w JOIN dbo.Workbenches wb ON w.WorkbenchId = wb.Id;
UPDATE r  SET NewRecordId           = rec.NewId FROM dbo.RecordOperationCriteria r JOIN dbo.Records rec ON r.RecordId = rec.Id;
UPDATE r  SET NewOperationCriterionId = c.NewId FROM dbo.RecordOperationCriteria r JOIN dbo.OperationCriteria c ON r.OperationCriterionId = c.Id;
";

        protected override void Up(MigrationBuilder b)
        {
            b.Sql(BackfillSql);

            // 0. The Serials view is SCHEMABINDING-bound to Records.OperationHostDeviceId
            //    + OperationHostDevices.HostDeviceId/OperationId. Drop it before the
            //    column-type changes and recreate it at the end with the new types.
            b.Sql("DROP VIEW IF EXISTS dbo.Serials;");

            // 1. Drop inbound FKs.
            b.DropForeignKey("FK_Records_OperationHostDevices_OperationHostDeviceId", "Records");
            b.DropForeignKey("FK_OperationCriteria_Operations_OperationId", "OperationCriteria");
            b.DropForeignKey("FK_OperationHostDevices_Operations_OperationId", "OperationHostDevices");
            b.DropForeignKey("FK_WorkbenchDeviceConfigurations_Workbenches_WorkbenchId", "WorkbenchDeviceConfigurations");
            b.DropForeignKey("FK_RecordOperationCriteria_Records_RecordId", "RecordOperationCriteria");
            b.DropForeignKey("FK_RecordOperationCriteria_OperationCriteria_OperationCriterionId", "RecordOperationCriteria");
            b.DropForeignKey("FK_Operations_Workbenches_WorkbenchId", "Operations");

            // 2. Drop indexes on int FK columns about to be dropped.
            b.DropIndex("IX_Records_OperationHostDeviceId", "Records");
            b.DropIndex("IX_OperationCriteria_OperationId", "OperationCriteria");
            b.DropIndex("IX_OperationHostDevices_OperationId", "OperationHostDevices");
            b.DropIndex("IX_WorkbenchDeviceConfigurations_WorkbenchId", "WorkbenchDeviceConfigurations");
            b.DropIndex("IX_RecordOperationCriteria_RecordId", "RecordOperationCriteria");
            b.DropIndex("IX_RecordOperationCriteria_OperationCriterionId", "RecordOperationCriteria");
            b.DropIndex("IX_Operations_WorkbenchId", "Operations");

            // 3. Drop legacy columns.
            b.DropColumn("IsActive", "Operations");
            b.DropColumn("IsActive", "Workbenches");
            b.DropColumn("OperationHostDeviceId", "Records");
            b.DropColumn("OperationId", "OperationCriteria");
            b.DropColumn("OperationId", "OperationHostDevices");
            b.DropColumn("WorkbenchId", "WorkbenchDeviceConfigurations");
            b.DropColumn("RecordId", "RecordOperationCriteria");
            b.DropColumn("OperationCriterionId", "RecordOperationCriteria");
            b.DropColumn("WorkbenchId", "Operations");

            // 4. Drop PKs + int Id columns on the flipping tables.
            b.DropPrimaryKey("PK_Operations", "Operations");
            b.DropColumn("Id", "Operations");
            b.DropPrimaryKey("PK_Records", "Records");
            b.DropColumn("Id", "Records");
            b.DropPrimaryKey("PK_Workbenches", "Workbenches");
            b.DropColumn("Id", "Workbenches");
            b.DropPrimaryKey("PK_OperationCriteria", "OperationCriteria");
            b.DropColumn("Id", "OperationCriteria");
            b.DropPrimaryKey("PK_OperationHostDevices", "OperationHostDevices");
            b.DropColumn("Id", "OperationHostDevices");
            b.DropPrimaryKey("PK_WorkbenchDeviceConfigurations", "WorkbenchDeviceConfigurations");
            b.DropColumn("Id", "WorkbenchDeviceConfigurations");
            b.DropPrimaryKey("PK_RecordOperationCriteria", "RecordOperationCriteria");
            b.DropColumn("Id", "RecordOperationCriteria");

            // 5. sp_rename shadow columns into canonical names.
            b.Sql("EXEC sp_rename N'dbo.Operations.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Operations.NewWorkbenchId', N'WorkbenchId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Records.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Records.NewOperationHostDeviceId', N'OperationHostDeviceId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Workbenches.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.OperationCriteria.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.OperationCriteria.NewOperationId', N'OperationId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.OperationHostDevices.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.OperationHostDevices.NewOperationId', N'OperationId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.WorkbenchDeviceConfigurations.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.WorkbenchDeviceConfigurations.NewWorkbenchId', N'WorkbenchId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.RecordOperationCriteria.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.RecordOperationCriteria.NewRecordId', N'RecordId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.RecordOperationCriteria.NewOperationCriterionId', N'OperationCriterionId', N'COLUMN';");

            // 6. NOT NULL on the renamed columns (WorkbenchId on Operations stays nullable).
            b.AlterColumn<Guid>("Id", "Operations", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "Records", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "Workbenches", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "OperationCriteria", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "OperationHostDevices", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "WorkbenchDeviceConfigurations", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "RecordOperationCriteria", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);

            b.AlterColumn<Guid>("OperationHostDeviceId", "Records", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("OperationId", "OperationCriteria", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("OperationId", "OperationHostDevices", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("WorkbenchId", "WorkbenchDeviceConfigurations", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("RecordId", "RecordOperationCriteria", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("OperationCriterionId", "RecordOperationCriteria", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            // Operations.WorkbenchId stays nullable (matches the entity's Guid? property).

            // 7. Recreate PKs.
            b.AddPrimaryKey("PK_Operations", "Operations", "Id");
            b.AddPrimaryKey("PK_Records", "Records", "Id");
            b.AddPrimaryKey("PK_Workbenches", "Workbenches", "Id");
            b.AddPrimaryKey("PK_OperationCriteria", "OperationCriteria", "Id");
            b.AddPrimaryKey("PK_OperationHostDevices", "OperationHostDevices", "Id");
            b.AddPrimaryKey("PK_WorkbenchDeviceConfigurations", "WorkbenchDeviceConfigurations", "Id");
            b.AddPrimaryKey("PK_RecordOperationCriteria", "RecordOperationCriteria", "Id");

            // 8. Recreate indexes on Guid FK columns.
            b.CreateIndex("IX_Records_OperationHostDeviceId", "Records", "OperationHostDeviceId");
            b.CreateIndex("IX_OperationCriteria_OperationId", "OperationCriteria", "OperationId");
            b.CreateIndex("IX_OperationHostDevices_OperationId", "OperationHostDevices", "OperationId");
            b.CreateIndex("IX_WorkbenchDeviceConfigurations_WorkbenchId", "WorkbenchDeviceConfigurations", "WorkbenchId");
            b.CreateIndex("IX_RecordOperationCriteria_RecordId", "RecordOperationCriteria", "RecordId");
            b.CreateIndex("IX_RecordOperationCriteria_OperationCriterionId", "RecordOperationCriteria", "OperationCriterionId");
            b.CreateIndex("IX_Operations_WorkbenchId", "Operations", "WorkbenchId");

            // 9. Recreate FKs (NoAction).
            b.AddForeignKey("FK_Records_OperationHostDevices_OperationHostDeviceId", "Records",
                "OperationHostDeviceId", "OperationHostDevices", principalColumn: "Id");
            b.AddForeignKey("FK_OperationCriteria_Operations_OperationId", "OperationCriteria",
                "OperationId", "Operations", principalColumn: "Id");
            b.AddForeignKey("FK_OperationHostDevices_Operations_OperationId", "OperationHostDevices",
                "OperationId", "Operations", principalColumn: "Id");
            b.AddForeignKey("FK_WorkbenchDeviceConfigurations_Workbenches_WorkbenchId", "WorkbenchDeviceConfigurations",
                "WorkbenchId", "Workbenches", principalColumn: "Id");
            b.AddForeignKey("FK_RecordOperationCriteria_Records_RecordId", "RecordOperationCriteria",
                "RecordId", "Records", principalColumn: "Id");
            b.AddForeignKey("FK_RecordOperationCriteria_OperationCriteria_OperationCriterionId", "RecordOperationCriteria",
                "OperationCriterionId", "OperationCriteria", principalColumn: "Id");
            b.AddForeignKey("FK_Operations_Workbenches_WorkbenchId", "Operations",
                "WorkbenchId", "Workbenches", principalColumn: "Id");

            // 10. Shared-PK Meta FKs (IWithMeta convention). Records is
            //     deliberately excluded — it's an immutable measurement stream
            //     with no user-facing lifecycle, so it stays plain DomainObject.
            b.AddForeignKey("FK_Operations_Meta_Id", "Operations",
                "Id", "Meta", principalColumn: "Id");
            b.AddForeignKey("FK_Workbenches_Meta_Id", "Workbenches",
                "Id", "Meta", principalColumn: "Id");

            // 11. Recreate the Serials view against the now-Guid columns.
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

        // Default scaffold inverse; doesn't recover original int Ids.
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("RAISERROR(N'Phase F migration is one-way; restore from backup to roll back.', 16, 1);");
        }
    }
}
