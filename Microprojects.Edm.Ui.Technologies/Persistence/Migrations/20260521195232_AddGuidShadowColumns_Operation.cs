using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    // Hand-written shadow columns for Phase F. Operation, Record, Workbench
    // each get Meta (IWithMeta); the four junctions (OperationCriterion,
    // OperationHostDevice, WorkbenchDeviceConfigurations, RecordOperationCriteria)
    // stay non-Meta but flip int PK -> Guid PK plus their incoming FKs.
    public partial class AddGuidShadowColumns_Operation : Migration
    {
        protected override void Up(MigrationBuilder b)
        {
            b.AddColumn<Guid>("NewId", "Operations", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewWorkbenchId", "Operations", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "Records", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewOperationHostDeviceId", "Records", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "Workbenches", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "OperationCriteria", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewOperationId", "OperationCriteria", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "OperationHostDevices", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewOperationId", "OperationHostDevices", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "WorkbenchDeviceConfigurations", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewWorkbenchId", "WorkbenchDeviceConfigurations", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "RecordOperationCriteria", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewRecordId", "RecordOperationCriteria", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewOperationCriterionId", "RecordOperationCriteria", "uniqueidentifier", nullable: true);
        }

        protected override void Down(MigrationBuilder b)
        {
            b.DropColumn("NewOperationCriterionId", "RecordOperationCriteria");
            b.DropColumn("NewRecordId", "RecordOperationCriteria");
            b.DropColumn("NewId", "RecordOperationCriteria");
            b.DropColumn("NewWorkbenchId", "WorkbenchDeviceConfigurations");
            b.DropColumn("NewId", "WorkbenchDeviceConfigurations");
            b.DropColumn("NewOperationId", "OperationHostDevices");
            b.DropColumn("NewId", "OperationHostDevices");
            b.DropColumn("NewOperationId", "OperationCriteria");
            b.DropColumn("NewId", "OperationCriteria");
            b.DropColumn("NewId", "Workbenches");
            b.DropColumn("NewOperationHostDeviceId", "Records");
            b.DropColumn("NewId", "Records");
            b.DropColumn("NewWorkbenchId", "Operations");
            b.DropColumn("NewId", "Operations");
        }
    }
}
