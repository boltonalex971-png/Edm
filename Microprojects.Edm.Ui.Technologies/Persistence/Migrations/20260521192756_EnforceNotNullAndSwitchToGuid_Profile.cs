using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    // Phase D destructive swap: Profile + Qualifier flip from int Id to Guid Id
    // and join the IWithMeta family. Downstream FK columns referencing either
    // flip int->Guid too: Audits.ProfileId, ProfilePoint.ProfileId,
    // OperationHostDevices.ProfileId, WorkbenchDeviceConfigurations.ProfileId,
    // AuditQualifier.QualifiersId (the EF-managed m2m join).
    //
    // Up() runs an inline data backfill (BackfillSql) that populates every NewId /
    // NewProfileId / NewQualifiersId column added by AddGuidShadowColumns_Profile,
    // replacing the external TechHierarchyBackfill tool that was never wired into the
    // installer.
    public partial class EnforceNotNullAndSwitchToGuid_Profile : Migration
    {
        // Data backfill (replaces the retired TechHierarchyBackfill tool): give Profiles and
        // Qualifiers database-friendly Guids (no NEWID) + a Meta row each, then map the FK
        // shadow columns added by AddGuidShadowColumns_Profile. Runs before the swap below.
        private const string BackfillSql = @"
DECLARE @base bigint = CONVERT(bigint, DATEDIFF_BIG(SECOND, '2020-01-01T00:00:00', SYSUTCDATETIME()));
DECLARE @now datetime2 = SYSUTCDATETIME();

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.Profiles WHERE NewId IS NULL)
UPDATE p SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.Profiles p JOIN s ON p.Id = s.Id;
INSERT INTO dbo.Meta (Id, Metatype, Owner, Groups, Created, Deleted)
SELECT NewId, N'Profile', N'', N'[]', @now, CASE WHEN IsActive = 0 THEN @now ELSE NULL END FROM dbo.Profiles;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.Qualifiers WHERE NewId IS NULL)
UPDATE q SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.Qualifiers q JOIN s ON q.Id = s.Id;
INSERT INTO dbo.Meta (Id, Metatype, Owner, Groups, Created, Deleted)
SELECT NewId, N'Qualifier', N'', N'[]', @now, CASE WHEN IsActive = 0 THEN @now ELSE NULL END FROM dbo.Qualifiers;

UPDATE a  SET NewProfileId   = p.NewId FROM dbo.Audits a JOIN dbo.Profiles p ON a.ProfileId = p.Id;
UPDATE pp SET NewProfileId   = p.NewId FROM dbo.ProfilePoint pp JOIN dbo.Profiles p ON pp.ProfileId = p.Id;
UPDATE o  SET NewProfileId   = p.NewId FROM dbo.OperationHostDevices o JOIN dbo.Profiles p ON o.ProfileId = p.Id;
UPDATE w  SET NewProfileId   = p.NewId FROM dbo.WorkbenchDeviceConfigurations w JOIN dbo.Profiles p ON w.ProfileId = p.Id;
UPDATE aq SET NewQualifiersId = q.NewId FROM dbo.AuditQualifier aq JOIN dbo.Qualifiers q ON aq.QualifiersId = q.Id;
";

        protected override void Up(MigrationBuilder b)
        {
            b.Sql(BackfillSql);

            // 1. Drop inbound FKs that reference the int Profile.Id / Qualifier.Id.
            b.DropForeignKey("FK_Audits_Profiles_ProfileId", "Audits");
            b.DropForeignKey("FK_ProfilePoint_Profiles_ProfileId", "ProfilePoint");
            b.DropForeignKey("FK_OperationHostDevices_Profiles_ProfileId", "OperationHostDevices");
            b.DropForeignKey("FK_WorkbenchDeviceConfigurations_Profiles_ProfileId", "WorkbenchDeviceConfigurations");
            b.DropForeignKey("FK_AuditQualifier_Qualifiers_QualifiersId", "AuditQualifier");

            // 2. Drop indexes on the int FK columns about to be dropped.
            b.DropIndex("IX_Audits_ProfileId", "Audits");
            b.DropIndex("IX_ProfilePoint_ProfileId", "ProfilePoint");
            b.DropIndex("IX_OperationHostDevices_ProfileId", "OperationHostDevices");
            b.DropIndex("IX_WorkbenchDeviceConfigurations_ProfileId", "WorkbenchDeviceConfigurations");
            b.DropIndex("IX_AuditQualifier_QualifiersId", "AuditQualifier");

            // 3. Drop AuditQualifier's composite PK (it depends on QualifiersId).
            b.DropPrimaryKey("PK_AuditQualifier", "AuditQualifier");

            // 4. Drop legacy columns.
            b.DropColumn("IsActive", "Profiles");
            b.DropColumn("IsActive", "Qualifiers");

            b.DropColumn("ProfileId", "Audits");
            b.DropColumn("ProfileId", "ProfilePoint");
            b.DropColumn("ProfileId", "OperationHostDevices");
            b.DropColumn("ProfileId", "WorkbenchDeviceConfigurations");
            b.DropColumn("QualifiersId", "AuditQualifier");

            // 5. Drop PKs on Profiles + Qualifiers and drop the int Id columns
            //    so the shadow NewId can take over.
            b.DropPrimaryKey("PK_Profiles", "Profiles");
            b.DropColumn("Id", "Profiles");
            b.DropPrimaryKey("PK_Qualifiers", "Qualifiers");
            b.DropColumn("Id", "Qualifiers");

            // 5. sp_rename shadow columns into their final names.
            b.Sql("EXEC sp_rename N'dbo.Profiles.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Qualifiers.NewId', N'Id', N'COLUMN';");

            b.Sql("EXEC sp_rename N'dbo.Audits.NewProfileId', N'ProfileId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.ProfilePoint.NewProfileId', N'ProfileId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.OperationHostDevices.NewProfileId', N'ProfileId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.WorkbenchDeviceConfigurations.NewProfileId', N'ProfileId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.AuditQualifier.NewQualifiersId', N'QualifiersId', N'COLUMN';");

            // 6. NOT NULL on the renamed Guid columns.
            b.AlterColumn<Guid>("Id", "Profiles", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "Qualifiers", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);

            b.AlterColumn<Guid>("ProfileId", "Audits", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("ProfileId", "ProfilePoint", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("ProfileId", "OperationHostDevices", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("ProfileId", "WorkbenchDeviceConfigurations", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("QualifiersId", "AuditQualifier", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);

            // 7. Recreate PKs.
            b.AddPrimaryKey("PK_Profiles", "Profiles", "Id");
            b.AddPrimaryKey("PK_Qualifiers", "Qualifiers", "Id");
            b.AddPrimaryKey("PK_AuditQualifier", "AuditQualifier", new[] { "AuditId", "QualifiersId" });

            // 8. Recreate indexes on the new Guid FK columns.
            b.CreateIndex("IX_Audits_ProfileId", "Audits", "ProfileId");
            b.CreateIndex("IX_ProfilePoint_ProfileId", "ProfilePoint", "ProfileId");
            b.CreateIndex("IX_OperationHostDevices_ProfileId", "OperationHostDevices", "ProfileId");
            b.CreateIndex("IX_WorkbenchDeviceConfigurations_ProfileId", "WorkbenchDeviceConfigurations", "ProfileId");
            b.CreateIndex("IX_AuditQualifier_QualifiersId", "AuditQualifier", "QualifiersId");

            // 9. Recreate FKs (NoAction — matches Phase C policy to avoid SQL
            //    cycle errors and let Meta-based soft-delete drive cleanup).
            b.AddForeignKey("FK_Audits_Profiles_ProfileId", "Audits",
                "ProfileId", "Profiles", principalColumn: "Id");
            b.AddForeignKey("FK_ProfilePoint_Profiles_ProfileId", "ProfilePoint",
                "ProfileId", "Profiles", principalColumn: "Id");
            b.AddForeignKey("FK_OperationHostDevices_Profiles_ProfileId", "OperationHostDevices",
                "ProfileId", "Profiles", principalColumn: "Id");
            b.AddForeignKey("FK_WorkbenchDeviceConfigurations_Profiles_ProfileId", "WorkbenchDeviceConfigurations",
                "ProfileId", "Profiles", principalColumn: "Id");
            b.AddForeignKey("FK_AuditQualifier_Qualifiers_QualifiersId", "AuditQualifier",
                "QualifiersId", "Qualifiers", principalColumn: "Id");

            // 10. Shared-PK Meta FKs (IWithMeta convention).
            b.AddForeignKey("FK_Profiles_Meta_Id", "Profiles",
                "Id", "Meta", principalColumn: "Id");
            b.AddForeignKey("FK_Qualifiers_Meta_Id", "Qualifiers",
                "Id", "Meta", principalColumn: "Id");
        }

        // Scaffold default. Like Phase C's Down(), this doesn't recover original
        // int Ids — restore from backup for production rollback.
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey("FK_Profiles_Meta_Id", "Profiles");
            migrationBuilder.DropForeignKey("FK_Qualifiers_Meta_Id", "Qualifiers");

            migrationBuilder.AlterColumn<int>("ProfileId", "WorkbenchDeviceConfigurations", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
            migrationBuilder.AlterColumn<int>("Id", "Qualifiers", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");
            migrationBuilder.AddColumn<bool>("IsActive", "Qualifiers", "bit", nullable: false, defaultValue: false);
            migrationBuilder.AlterColumn<int>("Id", "Profiles", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");
            migrationBuilder.AddColumn<bool>("IsActive", "Profiles", "bit", nullable: false, defaultValue: false);
            migrationBuilder.AlterColumn<int>("ProfileId", "ProfilePoint", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
            migrationBuilder.AlterColumn<int>("ProfileId", "OperationHostDevices", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
            migrationBuilder.AlterColumn<int>("ProfileId", "Audits", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
            migrationBuilder.AlterColumn<int>("QualifiersId", "AuditQualifier", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
        }
    }
}
