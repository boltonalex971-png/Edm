using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    // Hand-written shadow columns for Phase E. Audit becomes Guid + IWithMeta;
    // AuditZone + AuditCriterion become plain Guid-PK (no Meta — they share
    // lifecycle with their parent Audit). OperationCriteria.AuditCriterionId
    // flips int->Guid downstream.
    public partial class AddGuidShadowColumns_Audit : Migration
    {
        protected override void Up(MigrationBuilder b)
        {
            b.AddColumn<Guid>("NewId", "Audits", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "AuditZones", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewAuditId", "AuditZones", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewId", "AuditCriteria", "uniqueidentifier", nullable: true);
            b.AddColumn<Guid>("NewZoneId", "AuditCriteria", "uniqueidentifier", nullable: true);

            b.AddColumn<Guid>("NewAuditCriterionId", "OperationCriteria", "uniqueidentifier", nullable: true);
        }

        protected override void Down(MigrationBuilder b)
        {
            b.DropColumn("NewAuditCriterionId", "OperationCriteria");
            b.DropColumn("NewZoneId", "AuditCriteria");
            b.DropColumn("NewId", "AuditCriteria");
            b.DropColumn("NewAuditId", "AuditZones");
            b.DropColumn("NewId", "AuditZones");
            b.DropColumn("NewId", "Audits");
        }
    }
}
