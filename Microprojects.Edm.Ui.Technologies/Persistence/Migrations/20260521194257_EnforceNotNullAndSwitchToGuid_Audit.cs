using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    // Phase E destructive swap: Audit/AuditZone/AuditCriterion flip int Id ->
    // Guid Id. Audit also joins the IWithMeta family (shared-PK FK to Meta).
    // AuditZone and AuditCriterion stay non-Meta (subordinate lifecycle).
    // Downstream FKs flipped int->Guid: AuditZone.AuditId, AuditCriterion.ZoneId,
    // OperationCriteria.AuditCriterionId, AuditQualifier.AuditId.
    //
    // AuditQualifier.AuditId needs an inline shadow column + backfill because
    // AddGuidShadowColumns_Audit didn't include it (oversight). We do the
    // add/backfill at the top of this migration while Audits.NewId is still
    // around, then continue with the standard drop+sp_rename pattern.
    public partial class EnforceNotNullAndSwitchToGuid_Audit : Migration
    {
        protected override void Up(MigrationBuilder b)
        {
            // 0. AuditQualifier.NewAuditId shadow + backfill.
            b.Sql("ALTER TABLE AuditQualifier ADD NewAuditId uniqueidentifier NULL;");
            b.Sql(@"UPDATE aq SET NewAuditId = a.NewId
                    FROM AuditQualifier aq INNER JOIN Audits a ON a.Id = aq.AuditId
                    WHERE aq.NewAuditId IS NULL;");

            // 1. Drop inbound FKs that reference the int Audit.Id / AuditZone.Id / AuditCriterion.Id.
            b.DropForeignKey("FK_AuditZones_Audits_AuditId", "AuditZones");
            b.DropForeignKey("FK_AuditCriteria_AuditZones_ZoneId", "AuditCriteria");
            b.DropForeignKey("FK_OperationCriteria_AuditCriteria_AuditCriterionId", "OperationCriteria");
            b.DropForeignKey("FK_AuditQualifier_Audits_AuditId", "AuditQualifier");

            // 2. Drop indexes on the int FK columns about to be dropped.
            b.DropIndex("IX_AuditZones_AuditId", "AuditZones");
            b.DropIndex("IX_AuditCriteria_ZoneId", "AuditCriteria");
            b.DropIndex("IX_OperationCriteria_AuditCriterionId", "OperationCriteria");
            // AuditQualifier's index on AuditId is part of its composite PK; dropped with the PK below.

            // 3. Drop AuditQualifier's composite PK (depends on AuditId).
            b.DropPrimaryKey("PK_AuditQualifier", "AuditQualifier");

            // 4. Drop legacy columns.
            b.DropColumn("IsActive", "Audits");

            b.DropColumn("AuditId", "AuditZones");
            b.DropColumn("ZoneId", "AuditCriteria");
            b.DropColumn("AuditCriterionId", "OperationCriteria");
            b.DropColumn("AuditId", "AuditQualifier");

            // 5. Drop PKs on the three flipping tables + their int Id columns.
            b.DropPrimaryKey("PK_Audits", "Audits");
            b.DropColumn("Id", "Audits");
            b.DropPrimaryKey("PK_AuditZones", "AuditZones");
            b.DropColumn("Id", "AuditZones");
            b.DropPrimaryKey("PK_AuditCriteria", "AuditCriteria");
            b.DropColumn("Id", "AuditCriteria");

            // 6. sp_rename shadow columns into their final names.
            b.Sql("EXEC sp_rename N'dbo.Audits.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.AuditZones.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.AuditCriteria.NewId', N'Id', N'COLUMN';");

            b.Sql("EXEC sp_rename N'dbo.AuditZones.NewAuditId', N'AuditId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.AuditCriteria.NewZoneId', N'ZoneId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.OperationCriteria.NewAuditCriterionId', N'AuditCriterionId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.AuditQualifier.NewAuditId', N'AuditId', N'COLUMN';");

            // 7. NOT NULL on the renamed Guid columns.
            b.AlterColumn<Guid>("Id", "Audits", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "AuditZones", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "AuditCriteria", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);

            b.AlterColumn<Guid>("AuditId", "AuditZones", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("ZoneId", "AuditCriteria", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("AuditCriterionId", "OperationCriteria", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("AuditId", "AuditQualifier", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);

            // 8. Recreate PKs.
            b.AddPrimaryKey("PK_Audits", "Audits", "Id");
            b.AddPrimaryKey("PK_AuditZones", "AuditZones", "Id");
            b.AddPrimaryKey("PK_AuditCriteria", "AuditCriteria", "Id");
            b.AddPrimaryKey("PK_AuditQualifier", "AuditQualifier", new[] { "AuditId", "QualifiersId" });

            // 9. Recreate indexes on the new Guid FK columns.
            b.CreateIndex("IX_AuditZones_AuditId", "AuditZones", "AuditId");
            b.CreateIndex("IX_AuditCriteria_ZoneId", "AuditCriteria", "ZoneId");
            b.CreateIndex("IX_OperationCriteria_AuditCriterionId", "OperationCriteria", "AuditCriterionId");

            // 10. Recreate FKs (NoAction).
            b.AddForeignKey("FK_AuditZones_Audits_AuditId", "AuditZones",
                "AuditId", "Audits", principalColumn: "Id");
            b.AddForeignKey("FK_AuditCriteria_AuditZones_ZoneId", "AuditCriteria",
                "ZoneId", "AuditZones", principalColumn: "Id");
            b.AddForeignKey("FK_OperationCriteria_AuditCriteria_AuditCriterionId", "OperationCriteria",
                "AuditCriterionId", "AuditCriteria", principalColumn: "Id");
            b.AddForeignKey("FK_AuditQualifier_Audits_AuditId", "AuditQualifier",
                "AuditId", "Audits", principalColumn: "Id");

            // 11. Shared-PK Meta FK for Audit (IWithMeta convention).
            b.AddForeignKey("FK_Audits_Meta_Id", "Audits",
                "Id", "Meta", principalColumn: "Id");
        }

        // Scaffold default; doesn't recover original int Ids — restore from backup.
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey("FK_Audits_Meta_Id", "Audits");
            migrationBuilder.AlterColumn<int>("AuditCriterionId", "OperationCriteria", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
            migrationBuilder.AlterColumn<int>("AuditId", "AuditZones", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
            migrationBuilder.AlterColumn<int>("Id", "AuditZones", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");
            migrationBuilder.AlterColumn<int>("Id", "Audits", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");
            migrationBuilder.AddColumn<bool>("IsActive", "Audits", "bit", nullable: false, defaultValue: false);
            migrationBuilder.AlterColumn<int>("AuditId", "AuditQualifier", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
            migrationBuilder.AlterColumn<int>("ZoneId", "AuditCriteria", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
            migrationBuilder.AlterColumn<int>("Id", "AuditCriteria", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");
        }
    }
}
