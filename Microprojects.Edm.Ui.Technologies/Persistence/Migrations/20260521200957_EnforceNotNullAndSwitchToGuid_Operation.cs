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
        protected override void Up(MigrationBuilder b)
        {
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
