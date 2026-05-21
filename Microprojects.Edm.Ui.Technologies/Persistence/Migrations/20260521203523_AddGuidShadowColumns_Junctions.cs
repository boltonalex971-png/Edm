using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    // Phase G shadow columns. Flips the remaining int-PK tables to Guid:
    // Setting, HostDevice, WorkplaceHostDevice, WorkplaceProcess, ProfilePoint.
    // None of these get IWithMeta (no user-facing lifecycle worth tracking).
    // Downstream FK columns also get shadow Guids so the destructive migration
    // can sp_rename without losing references.
    public partial class AddGuidShadowColumns_Junctions : Migration
    {
        protected override void Up(MigrationBuilder b)
        {
            b.AddColumn<Guid>("NewId", "Settings", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "HostDevices", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewHostDeviceId", "WorkplaceHostDevices", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewHostDeviceId", "OperationHostDevices", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "WorkplaceHostDevices", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewWorkplaceHostDeviceId", "WorkbenchDeviceConfigurations", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "WorkplaceProcesses", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewWorkplaceProcessId", "Workbenches", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewWorkplaceProcessId", "Operations", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "ProfilePoint", "uniqueidentifier", nullable: true);
        }

        protected override void Down(MigrationBuilder b)
        {
            b.DropColumn("NewId", "ProfilePoint");
            b.DropColumn("NewWorkplaceProcessId", "Operations");
            b.DropColumn("NewWorkplaceProcessId", "Workbenches");
            b.DropColumn("NewId", "WorkplaceProcesses");
            b.DropColumn("NewWorkplaceHostDeviceId", "WorkbenchDeviceConfigurations");
            b.DropColumn("NewId", "WorkplaceHostDevices");
            b.DropColumn("NewHostDeviceId", "OperationHostDevices");
            b.DropColumn("NewHostDeviceId", "WorkplaceHostDevices");
            b.DropColumn("NewId", "HostDevices");
            b.DropColumn("NewId", "Settings");
        }
    }
}
