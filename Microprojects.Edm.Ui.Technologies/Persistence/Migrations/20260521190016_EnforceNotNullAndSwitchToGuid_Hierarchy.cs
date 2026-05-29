using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Technologies.Persistence.Migrations
{
    // Destructive swap: Host/Device/Process/Workplace flip from int Id +
    // HierarchyId to Guid Id + DirectoryId, joining the shared
    // DirectoryEntry/IWithMeta family. Junction-table FKs (HostDevices,
    // Profiles, Qualifiers, WorkplaceHostDevices, WorkplaceProcesses) flip
    // from int to Guid for the columns referencing those four entities.
    //
    // Up() first runs an inline data backfill (step 0, BackfillSql) that populates
    // every NewId/NewXxxId shadow column added by AddGuidShadowColumns — replacing the
    // external TechHierarchyBackfill tool the chain originally relied on, which was never
    // wired into the installer. It then drops the int columns and uses sp_rename to hoist
    // the shadow columns into the canonical names — preserving the backfilled Guid values
    // that downstream FKs reference.
    //
    // Down() is the EF-scaffolded inverse (drops the new schema, recreates
    // the legacy int columns). It would NOT recover the original int Ids;
    // restore from backup if you need to roll back in production.
    public partial class EnforceNotNullAndSwitchToGuid_Hierarchy : Migration
    {
        // Database-friendly Guid generator (no NEWID): 10 random bytes + a 48-bit
        // (seconds-since-2020 << 16 | per-row sequence) value in the bytes SQL Server
        // sorts most-significant, so backfilled rows stay sequential. <SEQ> is replaced
        // per call site with a ROW_NUMBER expression unique within the statement.
        private const string BackfillSql = @"
DECLARE @base bigint = CONVERT(bigint, DATEDIFF_BIG(SECOND, '2020-01-01T00:00:00', SYSUTCDATETIME()));
DECLARE @now datetime2 = SYSUTCDATETIME();

DECLARE @General    uniqueidentifier = '00000000-0000-0000-0000-000000000000';
DECLARE @Hosts      uniqueidentifier = '4d76a4e7-1d04-7a01-9000-edb0c0deca10';
DECLARE @Devices    uniqueidentifier = '4d76a4e7-1d04-7a02-9000-edb0c0deca10';
DECLARE @Processes  uniqueidentifier = '4d76a4e7-1d04-7a03-9000-edb0c0deca10';
DECLARE @Workplaces uniqueidentifier = '4d76a4e7-1d04-7a04-9000-edb0c0deca10';

-- old-int -> new-guid map for every legacy Hierarchies node.
CREATE TABLE #h2d (oldId int PRIMARY KEY, newId uniqueidentifier, parentOld int,
                   name nvarchar(max), descr nvarchar(max), isActive bit, depth int);

INSERT INTO #h2d (oldId, newId, parentOld, name, descr, isActive, depth)
SELECT h.Id,
       CASE h.Id
            WHEN 0 THEN @General WHEN 1 THEN @Hosts WHEN 2 THEN @Devices
            WHEN 3 THEN @Processes WHEN 4 THEN @Workplaces
            ELSE CAST(CAST(CRYPT_GEN_RANDOM(10) +
                 CONVERT(binary(6), @base * 65536 + (ROW_NUMBER() OVER (ORDER BY h.Id) % 65536))
                 AS binary(16)) AS uniqueidentifier)
       END,
       h.ParentId, h.Name, h.Description, h.IsActive, 0
FROM dbo.Hierarchies h;

-- depth for parent-before-child Directory insert order.
;WITH d AS (
    SELECT oldId, parentOld, 0 AS depth FROM #h2d WHERE parentOld IS NULL
    UNION ALL
    SELECT c.oldId, c.parentOld, p.depth + 1 FROM #h2d c JOIN d p ON c.parentOld = p.oldId
)
UPDATE m SET depth = d.depth FROM #h2d m JOIN d ON m.oldId = d.oldId OPTION (MAXRECURSION 0);

-- Meta + Directories for every reconstructed folder/root.
INSERT INTO dbo.Meta (Id, Metatype, Owner, Groups, Created, Modified, Deleted, Completed, OriginId)
SELECT newId, N'Directory', N'', N'[]', @now, NULL,
       CASE WHEN isActive = 0 THEN @now ELSE NULL END, NULL, NULL
FROM #h2d;

DECLARE @lvl int = 0, @maxlvl int = (SELECT MAX(depth) FROM #h2d);
WHILE @lvl <= @maxlvl
BEGIN
    INSERT INTO dbo.Directories (Id, DirectoryId, Name, Description)
    SELECT m.newId,
           CASE WHEN m.parentOld IS NULL THEN NULL ELSE p.newId END,
           ISNULL(m.name, N''), m.descr
    FROM #h2d m LEFT JOIN #h2d p ON m.parentOld = p.oldId
    WHERE m.depth = @lvl;
    SET @lvl += 1;
END

-- Leaf entities: own Guid + Meta + DirectoryId (mapped from legacy HierarchyId).
;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.Hosts WHERE NewId IS NULL)
UPDATE h SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.Hosts h JOIN s ON h.Id = s.Id;
UPDATE h SET NewDirectoryId = m.newId FROM dbo.Hosts h JOIN #h2d m ON h.HierarchyId = m.oldId;
INSERT INTO dbo.Meta (Id, Metatype, Owner, Groups, Created, Deleted)
SELECT NewId, N'Host', N'', N'[]', @now, CASE WHEN IsActive = 0 THEN @now ELSE NULL END FROM dbo.Hosts;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.Devices WHERE NewId IS NULL)
UPDATE d SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.Devices d JOIN s ON d.Id = s.Id;
UPDATE d SET NewDirectoryId = m.newId FROM dbo.Devices d JOIN #h2d m ON d.HierarchyId = m.oldId;
INSERT INTO dbo.Meta (Id, Metatype, Owner, Groups, Created, Deleted)
SELECT NewId, N'Device', N'', N'[]', @now, CASE WHEN IsActive = 0 THEN @now ELSE NULL END FROM dbo.Devices;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.Processes WHERE NewId IS NULL)
UPDATE p SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.Processes p JOIN s ON p.Id = s.Id;
UPDATE p SET NewDirectoryId = m.newId FROM dbo.Processes p JOIN #h2d m ON p.HierarchyId = m.oldId;
INSERT INTO dbo.Meta (Id, Metatype, Owner, Groups, Created, Deleted)
SELECT NewId, N'Process', N'', N'[]', @now, CASE WHEN IsActive = 0 THEN @now ELSE NULL END FROM dbo.Processes;

;WITH s AS (SELECT Id, ROW_NUMBER() OVER (ORDER BY Id) AS rn FROM dbo.Workplaces WHERE NewId IS NULL)
UPDATE w SET NewId = CAST(CAST(CRYPT_GEN_RANDOM(10) +
            CONVERT(binary(6), @base * 65536 + (s.rn % 65536)) AS binary(16)) AS uniqueidentifier)
FROM dbo.Workplaces w JOIN s ON w.Id = s.Id;
UPDATE w SET NewDirectoryId = m.newId FROM dbo.Workplaces w JOIN #h2d m ON w.HierarchyId = m.oldId;
INSERT INTO dbo.Meta (Id, Metatype, Owner, Groups, Created, Deleted)
SELECT NewId, N'Workplace', N'', N'[]', @now, CASE WHEN IsActive = 0 THEN @now ELSE NULL END FROM dbo.Workplaces;

-- Junction FK shadows: join legacy int FK to the referenced leaf's new Guid.
UPDATE hd SET NewHostId   = h.NewId  FROM dbo.HostDevices hd JOIN dbo.Hosts h      ON hd.HostId = h.Id;
UPDATE hd SET NewDeviceId = d.NewId  FROM dbo.HostDevices hd JOIN dbo.Devices d    ON hd.DeviceId = d.Id;
UPDATE p  SET NewProcessId = pr.NewId FROM dbo.Profiles p JOIN dbo.Processes pr    ON p.ProcessId = pr.Id;
UPDATE q  SET NewProcessId = pr.NewId FROM dbo.Qualifiers q JOIN dbo.Processes pr  ON q.ProcessId = pr.Id;
UPDATE w  SET NewWorkplaceId = wp.NewId FROM dbo.WorkplaceHostDevices w JOIN dbo.Workplaces wp ON w.WorkplaceId = wp.Id;
UPDATE w  SET NewWorkplaceId = wp.NewId FROM dbo.WorkplaceProcesses w JOIN dbo.Workplaces wp   ON w.WorkplaceId = wp.Id;
UPDATE w  SET NewProcessId   = pr.NewId FROM dbo.WorkplaceProcesses w JOIN dbo.Processes pr    ON w.ProcessId = pr.Id;

-- Name becomes NOT NULL on the four leaf tables below; ensure no legacy NULLs remain.
UPDATE dbo.Hosts      SET Name = N'' WHERE Name IS NULL;
UPDATE dbo.Devices    SET Name = N'' WHERE Name IS NULL;
UPDATE dbo.Processes  SET Name = N'' WHERE Name IS NULL;
UPDATE dbo.Workplaces SET Name = N'' WHERE Name IS NULL;

DROP TABLE #h2d;
";

        protected override void Up(MigrationBuilder b)
        {
            // 0. DATA BACKFILL (replaces the retired external TechHierarchyBackfill tool).
            //    Populates the nullable shadow Guid columns added by AddGuidShadowColumns so
            //    the destructive swap below preserves existing rows. Runs first, while the
            //    legacy int columns + Hierarchies table still exist. Guids are database-
            //    friendly (48-bit time in SQL-sort-significant bytes, CRYPT_GEN_RANDOM tail —
            //    no NEWID). Reconstructs the legacy Hierarchies folder tree into Directories
            //    (+Meta), maps the seed roots 0..4 onto the WellKnownDirectoryIds, and creates
            //    a Meta row per IWithMeta leaf (Owner/Groups left empty; soft-delete carried
            //    from the legacy IsActive flag).
            b.Sql(BackfillSql);

            // 1. Drop inbound junction FKs pointing at the int PKs we are about to drop.
            b.DropForeignKey("FK_HostDevices_Hosts_HostId", "HostDevices");
            b.DropForeignKey("FK_HostDevices_Devices_DeviceId", "HostDevices");
            b.DropForeignKey("FK_Profiles_Processes_ProcessId", "Profiles");
            b.DropForeignKey("FK_Qualifiers_Processes_ProcessId", "Qualifiers");
            b.DropForeignKey("FK_WorkplaceHostDevices_Workplaces_WorkplaceId", "WorkplaceHostDevices");
            b.DropForeignKey("FK_WorkplaceProcesses_Workplaces_WorkplaceId", "WorkplaceProcesses");
            b.DropForeignKey("FK_WorkplaceProcesses_Processes_ProcessId", "WorkplaceProcesses");

            // 2. Drop Hierarchy-side FKs on the four leaf tables.
            b.DropForeignKey("FK_Devices_Hierarchies_HierarchyId", "Devices");
            b.DropForeignKey("FK_Hosts_Hierarchies_HierarchyId", "Hosts");
            b.DropForeignKey("FK_Processes_Hierarchies_HierarchyId", "Processes");
            b.DropForeignKey("FK_Workplaces_Hierarchies_HierarchyId", "Workplaces");

            // 3. Drop the now-orphaned Hierarchies table itself.
            b.DropTable("Hierarchies");

            // 4. Drop indexes on the int FK columns about to be dropped.
            b.DropIndex("IX_HostDevices_HostId", "HostDevices");
            b.DropIndex("IX_HostDevices_DeviceId", "HostDevices");
            b.DropIndex("IX_Profiles_ProcessId", "Profiles");
            b.DropIndex("IX_Qualifiers_ProcessId", "Qualifiers");
            b.DropIndex("IX_WorkplaceHostDevices_WorkplaceId", "WorkplaceHostDevices");
            b.DropIndex("IX_WorkplaceProcesses_WorkplaceId", "WorkplaceProcesses");
            b.DropIndex("IX_WorkplaceProcesses_ProcessId", "WorkplaceProcesses");

            b.DropIndex("IX_Devices_HierarchyId", "Devices");
            b.DropIndex("IX_Hosts_HierarchyId", "Hosts");
            b.DropIndex("IX_Processes_HierarchyId", "Processes");
            b.DropIndex("IX_Workplaces_HierarchyId", "Workplaces");

            // 5. Drop legacy columns (HierarchyId + IsActive on the four leaf
            //    tables; old int FK columns on junctions).
            b.DropColumn("HierarchyId", "Devices");
            b.DropColumn("IsActive", "Devices");
            b.DropColumn("HierarchyId", "Hosts");
            b.DropColumn("IsActive", "Hosts");
            b.DropColumn("HierarchyId", "Processes");
            b.DropColumn("IsActive", "Processes");
            b.DropColumn("HierarchyId", "Workplaces");
            b.DropColumn("IsActive", "Workplaces");

            b.DropColumn("HostId", "HostDevices");
            b.DropColumn("DeviceId", "HostDevices");
            b.DropColumn("ProcessId", "Profiles");
            b.DropColumn("ProcessId", "Qualifiers");
            b.DropColumn("WorkplaceId", "WorkplaceHostDevices");
            b.DropColumn("WorkplaceId", "WorkplaceProcesses");
            b.DropColumn("ProcessId", "WorkplaceProcesses");

            // 6. Drop PKs on the four leaf tables and drop the int Id columns
            //    so the shadow NewId can take over the canonical name.
            b.DropPrimaryKey("PK_Devices", "Devices");
            b.DropColumn("Id", "Devices");
            b.DropPrimaryKey("PK_Hosts", "Hosts");
            b.DropColumn("Id", "Hosts");
            b.DropPrimaryKey("PK_Processes", "Processes");
            b.DropColumn("Id", "Processes");
            b.DropPrimaryKey("PK_Workplaces", "Workplaces");
            b.DropColumn("Id", "Workplaces");

            // 7. sp_rename shadow columns into their final names. Object name
            //    needs to be schema-qualified+bracketed for sp_rename's COLUMN
            //    target ("dbo.Table.Column"); the third argument is the new
            //    column name only.
            b.Sql("EXEC sp_rename N'dbo.Devices.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Devices.NewDirectoryId', N'DirectoryId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Hosts.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Hosts.NewDirectoryId', N'DirectoryId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Processes.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Processes.NewDirectoryId', N'DirectoryId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Workplaces.NewId', N'Id', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Workplaces.NewDirectoryId', N'DirectoryId', N'COLUMN';");

            b.Sql("EXEC sp_rename N'dbo.HostDevices.NewHostId', N'HostId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.HostDevices.NewDeviceId', N'DeviceId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Profiles.NewProcessId', N'ProcessId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.Qualifiers.NewProcessId', N'ProcessId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.WorkplaceHostDevices.NewWorkplaceId', N'WorkplaceId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.WorkplaceProcesses.NewWorkplaceId', N'WorkplaceId', N'COLUMN';");
            b.Sql("EXEC sp_rename N'dbo.WorkplaceProcesses.NewProcessId', N'ProcessId', N'COLUMN';");

            // The lingering Hierarchies.NewId was added by AddGuidShadowColumns
            // but the table itself was dropped in step 3, so no rename needed.

            // 8. Now that the canonical names exist, enforce NOT NULL on the
            //    Guid columns that were nullable shadows.
            b.AlterColumn<Guid>("Id", "Devices", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "Hosts", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "Processes", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("Id", "Workplaces", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            // DirectoryId on the four leaf tables stays nullable (DirectoryEntry models it as Guid?).

            b.AlterColumn<Guid>("HostId", "HostDevices", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("DeviceId", "HostDevices", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("ProcessId", "Profiles", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("ProcessId", "Qualifiers", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("WorkplaceId", "WorkplaceHostDevices", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("WorkplaceId", "WorkplaceProcesses", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);
            b.AlterColumn<Guid>("ProcessId", "WorkplaceProcesses", "uniqueidentifier", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier", oldNullable: true);

            // 9. Tighten Name on the four leaf tables (DirectoryEntry says
            //    required string Name).
            b.AlterColumn<string>("Name", "Devices", "nvarchar(max)", nullable: false,
                defaultValue: "", oldClrType: typeof(string), oldType: "nvarchar(max)", oldNullable: true);
            b.AlterColumn<string>("Name", "Hosts", "nvarchar(max)", nullable: false,
                defaultValue: "", oldClrType: typeof(string), oldType: "nvarchar(max)", oldNullable: true);
            b.AlterColumn<string>("Name", "Processes", "nvarchar(max)", nullable: false,
                defaultValue: "", oldClrType: typeof(string), oldType: "nvarchar(max)", oldNullable: true);
            b.AlterColumn<string>("Name", "Workplaces", "nvarchar(max)", nullable: false,
                defaultValue: "", oldClrType: typeof(string), oldType: "nvarchar(max)", oldNullable: true);

            // 10. Re-add PKs on the four leaf tables.
            b.AddPrimaryKey("PK_Devices", "Devices", "Id");
            b.AddPrimaryKey("PK_Hosts", "Hosts", "Id");
            b.AddPrimaryKey("PK_Processes", "Processes", "Id");
            b.AddPrimaryKey("PK_Workplaces", "Workplaces", "Id");

            // 11. Indexes on the new FK columns.
            b.CreateIndex("IX_Devices_DirectoryId", "Devices", "DirectoryId");
            b.CreateIndex("IX_Hosts_DirectoryId", "Hosts", "DirectoryId");
            b.CreateIndex("IX_Processes_DirectoryId", "Processes", "DirectoryId");
            b.CreateIndex("IX_Workplaces_DirectoryId", "Workplaces", "DirectoryId");

            b.CreateIndex("IX_HostDevices_HostId", "HostDevices", "HostId");
            b.CreateIndex("IX_HostDevices_DeviceId", "HostDevices", "DeviceId");
            b.CreateIndex("IX_Profiles_ProcessId", "Profiles", "ProcessId");
            b.CreateIndex("IX_Qualifiers_ProcessId", "Qualifiers", "ProcessId");
            b.CreateIndex("IX_WorkplaceHostDevices_WorkplaceId", "WorkplaceHostDevices", "WorkplaceId");
            b.CreateIndex("IX_WorkplaceProcesses_WorkplaceId", "WorkplaceProcesses", "WorkplaceId");
            b.CreateIndex("IX_WorkplaceProcesses_ProcessId", "WorkplaceProcesses", "ProcessId");

            // 12. New foreign keys.
            //   a. The four leaf tables → Directories (folder parent) + Meta (shared-PK).
            b.AddForeignKey("FK_Devices_Directories_DirectoryId", "Devices",
                "DirectoryId", "Directories", principalColumn: "Id");
            b.AddForeignKey("FK_Devices_Meta_Id", "Devices",
                "Id", "Meta", principalColumn: "Id");
            b.AddForeignKey("FK_Hosts_Directories_DirectoryId", "Hosts",
                "DirectoryId", "Directories", principalColumn: "Id");
            b.AddForeignKey("FK_Hosts_Meta_Id", "Hosts",
                "Id", "Meta", principalColumn: "Id");
            b.AddForeignKey("FK_Processes_Directories_DirectoryId", "Processes",
                "DirectoryId", "Directories", principalColumn: "Id");
            b.AddForeignKey("FK_Processes_Meta_Id", "Processes",
                "Id", "Meta", principalColumn: "Id");
            b.AddForeignKey("FK_Workplaces_Directories_DirectoryId", "Workplaces",
                "DirectoryId", "Directories", principalColumn: "Id");
            b.AddForeignKey("FK_Workplaces_Meta_Id", "Workplaces",
                "Id", "Meta", principalColumn: "Id");

            //   b. Junction tables → flipped leaf tables.
            b.AddForeignKey("FK_HostDevices_Hosts_HostId", "HostDevices",
                "HostId", "Hosts", principalColumn: "Id");
            b.AddForeignKey("FK_HostDevices_Devices_DeviceId", "HostDevices",
                "DeviceId", "Devices", principalColumn: "Id");
            b.AddForeignKey("FK_Profiles_Processes_ProcessId", "Profiles",
                "ProcessId", "Processes", principalColumn: "Id");
            b.AddForeignKey("FK_Qualifiers_Processes_ProcessId", "Qualifiers",
                "ProcessId", "Processes", principalColumn: "Id");
            b.AddForeignKey("FK_WorkplaceHostDevices_Workplaces_WorkplaceId", "WorkplaceHostDevices",
                "WorkplaceId", "Workplaces", principalColumn: "Id");
            b.AddForeignKey("FK_WorkplaceProcesses_Workplaces_WorkplaceId", "WorkplaceProcesses",
                "WorkplaceId", "Workplaces", principalColumn: "Id");
            b.AddForeignKey("FK_WorkplaceProcesses_Processes_ProcessId", "WorkplaceProcesses",
                "ProcessId", "Processes", principalColumn: "Id");
        }

        // The default EF-scaffolded inverse. It would drop the new schema and
        // recreate the legacy int columns with default zeros — it does NOT
        // recover the original int Ids. Restore from backup if you need to
        // roll back in production.
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey("FK_Devices_Directories_DirectoryId", "Devices");
            migrationBuilder.DropForeignKey("FK_Devices_Meta_Id", "Devices");
            migrationBuilder.DropForeignKey("FK_Hosts_Directories_DirectoryId", "Hosts");
            migrationBuilder.DropForeignKey("FK_Hosts_Meta_Id", "Hosts");
            migrationBuilder.DropForeignKey("FK_Processes_Directories_DirectoryId", "Processes");
            migrationBuilder.DropForeignKey("FK_Processes_Meta_Id", "Processes");
            migrationBuilder.DropForeignKey("FK_Workplaces_Directories_DirectoryId", "Workplaces");
            migrationBuilder.DropForeignKey("FK_Workplaces_Meta_Id", "Workplaces");

            migrationBuilder.DropIndex("IX_Workplaces_DirectoryId", "Workplaces");
            migrationBuilder.DropIndex("IX_Processes_DirectoryId", "Processes");
            migrationBuilder.DropIndex("IX_Hosts_DirectoryId", "Hosts");
            migrationBuilder.DropIndex("IX_Devices_DirectoryId", "Devices");

            migrationBuilder.DropColumn("DirectoryId", "Workplaces");
            migrationBuilder.DropColumn("DirectoryId", "Processes");
            migrationBuilder.DropColumn("DirectoryId", "Hosts");
            migrationBuilder.DropColumn("DirectoryId", "Devices");

            migrationBuilder.AlterColumn<string>("Name", "Workplaces", "nvarchar(max)", nullable: true,
                oldClrType: typeof(string), oldType: "nvarchar(max)");
            migrationBuilder.AlterColumn<int>("Id", "Workplaces", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");
            migrationBuilder.AddColumn<int>("HierarchyId", "Workplaces", "int", nullable: false, defaultValue: 0);
            migrationBuilder.AddColumn<bool>("IsActive", "Workplaces", "bit", nullable: false, defaultValue: false);

            migrationBuilder.AlterColumn<int>("WorkplaceId", "WorkplaceProcesses", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
            migrationBuilder.AlterColumn<int>("ProcessId", "WorkplaceProcesses", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
            migrationBuilder.AlterColumn<int>("WorkplaceId", "WorkplaceHostDevices", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
            migrationBuilder.AlterColumn<int>("ProcessId", "Qualifiers", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
            migrationBuilder.AlterColumn<int>("ProcessId", "Profiles", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<string>("Name", "Processes", "nvarchar(max)", nullable: true,
                oldClrType: typeof(string), oldType: "nvarchar(max)");
            migrationBuilder.AlterColumn<int>("Id", "Processes", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");
            migrationBuilder.AddColumn<int>("HierarchyId", "Processes", "int", nullable: false, defaultValue: 0);
            migrationBuilder.AddColumn<bool>("IsActive", "Processes", "bit", nullable: false, defaultValue: false);

            migrationBuilder.AlterColumn<string>("Name", "Hosts", "nvarchar(max)", nullable: true,
                oldClrType: typeof(string), oldType: "nvarchar(max)");
            migrationBuilder.AlterColumn<int>("Id", "Hosts", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");
            migrationBuilder.AddColumn<int>("HierarchyId", "Hosts", "int", nullable: false, defaultValue: 0);
            migrationBuilder.AddColumn<bool>("IsActive", "Hosts", "bit", nullable: false, defaultValue: false);

            migrationBuilder.AlterColumn<int>("HostId", "HostDevices", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");
            migrationBuilder.AlterColumn<int>("DeviceId", "HostDevices", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<string>("Name", "Devices", "nvarchar(max)", nullable: true,
                oldClrType: typeof(string), oldType: "nvarchar(max)");
            migrationBuilder.AlterColumn<int>("Id", "Devices", "int", nullable: false,
                oldClrType: typeof(Guid), oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");
            migrationBuilder.AddColumn<int>("HierarchyId", "Devices", "int", nullable: false, defaultValue: 0);
            migrationBuilder.AddColumn<bool>("IsActive", "Devices", "bit", nullable: false, defaultValue: false);

            migrationBuilder.CreateTable(
                name: "Hierarchies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ParentId = table.Column<int>(type: "int", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Group = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsPublic = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Owner = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Type = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hierarchies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Hierarchies_Hierarchies_ParentId",
                        column: x => x.ParentId,
                        principalTable: "Hierarchies",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex("IX_Workplaces_HierarchyId", "Workplaces", "HierarchyId");
            migrationBuilder.CreateIndex("IX_Processes_HierarchyId", "Processes", "HierarchyId");
            migrationBuilder.CreateIndex("IX_Hosts_HierarchyId", "Hosts", "HierarchyId");
            migrationBuilder.CreateIndex("IX_Devices_HierarchyId", "Devices", "HierarchyId");
            migrationBuilder.CreateIndex("IX_Hierarchies_ParentId", "Hierarchies", "ParentId");

            migrationBuilder.AddForeignKey("FK_Devices_Hierarchies_HierarchyId", "Devices",
                "HierarchyId", "Hierarchies", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
            migrationBuilder.AddForeignKey("FK_Hosts_Hierarchies_HierarchyId", "Hosts",
                "HierarchyId", "Hierarchies", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
            migrationBuilder.AddForeignKey("FK_Processes_Hierarchies_HierarchyId", "Processes",
                "HierarchyId", "Hierarchies", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
            migrationBuilder.AddForeignKey("FK_Workplaces_Hierarchies_HierarchyId", "Workplaces",
                "HierarchyId", "Hierarchies", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
        }
    }
}
