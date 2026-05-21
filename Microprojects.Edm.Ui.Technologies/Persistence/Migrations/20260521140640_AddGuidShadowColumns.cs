using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    // Hand-written shadow-column migration with no EF model diff. Adds nullable
    // Guid columns alongside the existing int Id/FK columns so the data backfill
    // migration can populate Guids per row without touching the live schema.
    // The C# entity classes still expose int Id/HierarchyId; the swap happens
    // in EnforceNotNullAndSwitchToGuid.
    public partial class AddGuidShadowColumns : Migration
    {
        protected override void Up(MigrationBuilder b)
        {
            b.AddColumn<Guid>("NewId", "Hierarchies", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "Hosts", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewDirectoryId", "Hosts", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "Devices", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewDirectoryId", "Devices", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "Processes", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewDirectoryId", "Processes", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "Workplaces", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewDirectoryId", "Workplaces", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewHostId", "HostDevices", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewDeviceId", "HostDevices", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewProcessId", "Profiles", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewProcessId", "Qualifiers", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewWorkplaceId", "WorkplaceHostDevices", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewWorkplaceId", "WorkplaceProcesses", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewProcessId", "WorkplaceProcesses", "uniqueidentifier", nullable: true);
        }

        protected override void Down(MigrationBuilder b)
        {
            b.DropColumn("NewProcessId", "WorkplaceProcesses");
            b.DropColumn("NewWorkplaceId", "WorkplaceProcesses");
            b.DropColumn("NewWorkplaceId", "WorkplaceHostDevices");
            b.DropColumn("NewProcessId", "Qualifiers");
            b.DropColumn("NewProcessId", "Profiles");
            b.DropColumn("NewDeviceId", "HostDevices");
            b.DropColumn("NewHostId", "HostDevices");
            b.DropColumn("NewDirectoryId", "Workplaces");
            b.DropColumn("NewId", "Workplaces");
            b.DropColumn("NewDirectoryId", "Processes");
            b.DropColumn("NewId", "Processes");
            b.DropColumn("NewDirectoryId", "Devices");
            b.DropColumn("NewId", "Devices");
            b.DropColumn("NewDirectoryId", "Hosts");
            b.DropColumn("NewId", "Hosts");
            b.DropColumn("NewId", "Hierarchies");
        }
    }
}
