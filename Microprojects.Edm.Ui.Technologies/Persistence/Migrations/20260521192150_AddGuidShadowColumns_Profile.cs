using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    // Hand-written shadow columns for Phase D. Adds nullable Guid columns
    // alongside the existing int Id/FK columns on Profiles + Qualifiers and
    // every table that references either. The backfill tool populates the
    // shadows; the destructive Phase-D migration hoists them into the
    // canonical names.
    public partial class AddGuidShadowColumns_Profile : Migration
    {
        protected override void Up(MigrationBuilder b)
        {
            b.AddColumn<Guid>("NewId", "Profiles", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewId", "Qualifiers", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewProfileId", "ProfilePoint", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewProfileId", "Audits", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewProfileId", "OperationHostDevices", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewProfileId", "WorkbenchDeviceConfigurations", "uniqueidentifier", nullable: true);

            // EF named the m2m join column QualifiersId (collection name is Audit.Qualifiers).
            b.AddColumn<Guid>("NewQualifiersId", "AuditQualifier", "uniqueidentifier", nullable: true);
        }

        protected override void Down(MigrationBuilder b)
        {
            b.DropColumn("NewQualifiersId", "AuditQualifier");
            b.DropColumn("NewProfileId", "WorkbenchDeviceConfigurations");
            b.DropColumn("NewProfileId", "OperationHostDevices");
            b.DropColumn("NewProfileId", "Audits");
            b.DropColumn("NewProfileId", "ProfilePoint");
            b.DropColumn("NewId", "Qualifiers");
            b.DropColumn("NewId", "Profiles");
        }
    }
}
