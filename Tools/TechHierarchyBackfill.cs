#:package Microsoft.Data.SqlClient@6.1.1
#:package UUIDNext@4.2.2

// One-shot backfill that runs between the AddGuidShadowColumns EF migration
// and the destructive PK-swap migration. Populates the New* shadow columns
// with UUIDv8 (UUIDNext) Guids and inserts the corresponding Directory + Meta
// rows. Idempotent: re-runnable; every step LEFT JOINs the destination and
// guards on NULL so already-populated rows are skipped.
//
// Run with .NET 10 file-based apps:
//   dotnet run Tools/TechHierarchyBackfill.cs -- --connection-string "..."

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using UUIDNext;

var connectionString = ParseConnectionString(args);
if (connectionString is null)
{
    Console.Error.WriteLine("Usage: dotnet run TechHierarchyBackfill.cs -- --connection-string \"...\"");
    return 1;
}

// The five well-known Tech directory roots. Must stay in sync with
// Microprojects.Edm.Ui.Technologies.Models.WellKnownDirectoryIds when that
// class lands.
var rootMap = new Dictionary<int, Guid>
{
    [0] = Guid.Empty,
    [1] = Guid.Parse("4d76a4e7-1d04-7a01-9000-edb0c0deca10"), // Hosts
    [2] = Guid.Parse("4d76a4e7-1d04-7a02-9000-edb0c0deca10"), // Devices
    [3] = Guid.Parse("4d76a4e7-1d04-7a03-9000-edb0c0deca10"), // Processes
    [4] = Guid.Parse("4d76a4e7-1d04-7a04-9000-edb0c0deca10"), // Workplaces
};

await using var conn = new SqlConnection(connectionString);
await conn.OpenAsync();

await using var tx = (SqlTransaction)await conn.BeginTransactionAsync();
try
{
    // Phase-C steps only run when the legacy Hierarchies table is still
    // present (i.e. EnforceNotNullAndSwitchToGuid_Hierarchy has not yet
    // applied). After Phase C is done they are no-ops via skip.
    var hierarchiesAlive = await TableExists(conn, tx, "Hierarchies");
    if (hierarchiesAlive)
    {
        await BackfillHierarchiesNewIds(conn, tx, rootMap);
        await BackfillLeafNewIds(conn, tx, "Hosts");
        await BackfillLeafNewIds(conn, tx, "Devices");
        await BackfillLeafNewIds(conn, tx, "Processes");
        await BackfillLeafNewIds(conn, tx, "Workplaces");

        await InsertMetaForHierarchies(conn, tx);
        await InsertMetaForLeaf(conn, tx, "Hosts", "Host");
        await InsertMetaForLeaf(conn, tx, "Devices", "Device");
        await InsertMetaForLeaf(conn, tx, "Processes", "Process");
        await InsertMetaForLeaf(conn, tx, "Workplaces", "Workplace");

        await InsertDirectoriesForHierarchies(conn, tx);

        await BackfillLeafNewDirectoryId(conn, tx, "Hosts");
        await BackfillLeafNewDirectoryId(conn, tx, "Devices");
        await BackfillLeafNewDirectoryId(conn, tx, "Processes");
        await BackfillLeafNewDirectoryId(conn, tx, "Workplaces");

        await BackfillIndirectFk(conn, tx, "HostDevices", "NewHostId", "HostId", "Hosts");
        await BackfillIndirectFk(conn, tx, "HostDevices", "NewDeviceId", "DeviceId", "Devices");
        await BackfillIndirectFk(conn, tx, "Profiles", "NewProcessId", "ProcessId", "Processes");
        await BackfillIndirectFk(conn, tx, "Qualifiers", "NewProcessId", "ProcessId", "Processes");
        await BackfillIndirectFk(conn, tx, "WorkplaceHostDevices", "NewWorkplaceId", "WorkplaceId", "Workplaces");
        await BackfillIndirectFk(conn, tx, "WorkplaceProcesses", "NewWorkplaceId", "WorkplaceId", "Workplaces");
        await BackfillIndirectFk(conn, tx, "WorkplaceProcesses", "NewProcessId", "ProcessId", "Processes");
    }
    else
    {
        Console.WriteLine("Hierarchies table not found — Phase C already applied; skipping its steps.");
    }

    // Phase D: Profile + Qualifier shadow Ids, downstream NewProfileId/NewQualifiersId.
    if (await ColumnExists(conn, tx, "Profiles", "NewId"))
    {
        await BackfillLeafNewIds(conn, tx, "Profiles");
        await BackfillLeafNewIds(conn, tx, "Qualifiers");
        await InsertMetaForLegacyEntity(conn, tx, "Profiles", "Profile");
        await InsertMetaForLegacyEntity(conn, tx, "Qualifiers", "Qualifier");
        await BackfillIndirectFk(conn, tx, "ProfilePoint", "NewProfileId", "ProfileId", "Profiles");
        await BackfillIndirectFk(conn, tx, "Audits", "NewProfileId", "ProfileId", "Profiles");
        await BackfillIndirectFk(conn, tx, "OperationHostDevices", "NewProfileId", "ProfileId", "Profiles");
        await BackfillIndirectFk(conn, tx, "WorkbenchDeviceConfigurations", "NewProfileId", "ProfileId", "Profiles");
        await BackfillIndirectFk(conn, tx, "AuditQualifier", "NewQualifiersId", "QualifiersId", "Qualifiers");
    }
    else
    {
        Console.WriteLine("Profiles.NewId not found — Phase D already applied; skipping its steps.");
    }

    // Phase E: Audit / AuditZone / AuditCriterion. Audit gets Meta;
    // AuditZone + AuditCriterion are non-Meta Guid-PK (subordinate lifecycle).
    if (await ColumnExists(conn, tx, "Audits", "NewId"))
    {
        await BackfillLeafNewIds(conn, tx, "Audits");
        await BackfillLeafNewIds(conn, tx, "AuditZones");
        await BackfillLeafNewIds(conn, tx, "AuditCriteria");
        await InsertMetaForLegacyEntity(conn, tx, "Audits", "Audit");
        await BackfillIndirectFk(conn, tx, "AuditZones", "NewAuditId", "AuditId", "Audits");
        await BackfillIndirectFk(conn, tx, "AuditCriteria", "NewZoneId", "ZoneId", "AuditZones");
        await BackfillIndirectFk(conn, tx, "OperationCriteria", "NewAuditCriterionId", "AuditCriterionId", "AuditCriteria");
    }
    else
    {
        Console.WriteLine("Audits.NewId not found — Phase E already applied; skipping its steps.");
    }

    // Phase F: Operation / Record / Workbench (all IWithMeta) plus four
    // junctions (OperationCriterion, OperationHostDevice,
    // WorkbenchDeviceConfigurations, RecordOperationCriteria) flipping to
    // Guid PK. Records is large (~230k rows); use bulk minting for it.
    if (await ColumnExists(conn, tx, "Operations", "NewId"))
    {
        await BackfillLeafNewIds(conn, tx, "Operations");
        await BackfillLeafNewIds(conn, tx, "Workbenches");
        await BackfillLeafNewIdsBulk(conn, tx, "Records");
        await BackfillLeafNewIdsBulk(conn, tx, "OperationCriteria");
        await BackfillLeafNewIds(conn, tx, "OperationHostDevices");
        await BackfillLeafNewIds(conn, tx, "WorkbenchDeviceConfigurations");
        await BackfillLeafNewIdsBulk(conn, tx, "RecordOperationCriteria");

        await InsertMetaForLegacyEntity(conn, tx, "Operations", "Operation");
        await InsertMetaForLegacyEntity(conn, tx, "Workbenches", "Workbench");
        // Records intentionally skipped — immutable measurement stream, not IWithMeta.

        await BackfillIndirectFk(conn, tx, "Operations", "NewWorkbenchId", "WorkbenchId", "Workbenches");
        await BackfillIndirectFk(conn, tx, "OperationCriteria", "NewOperationId", "OperationId", "Operations");
        await BackfillIndirectFk(conn, tx, "OperationHostDevices", "NewOperationId", "OperationId", "Operations");
        await BackfillIndirectFk(conn, tx, "WorkbenchDeviceConfigurations", "NewWorkbenchId", "WorkbenchId", "Workbenches");
        await BackfillIndirectFk(conn, tx, "Records", "NewOperationHostDeviceId", "OperationHostDeviceId", "OperationHostDevices");
        await BackfillIndirectFk(conn, tx, "RecordOperationCriteria", "NewRecordId", "RecordId", "Records");
        await BackfillIndirectFk(conn, tx, "RecordOperationCriteria", "NewOperationCriterionId", "OperationCriterionId", "OperationCriteria");
    }
    else
    {
        Console.WriteLine("Operations.NewId not found — Phase F already applied; skipping its steps.");
    }

    await tx.CommitAsync();
    Console.WriteLine("Backfill complete.");
    return 0;
}
catch
{
    await tx.RollbackAsync();
    throw;
}

static string? ParseConnectionString(string[] args)
{
    for (var i = 0; i < args.Length - 1; i++)
    {
        if (args[i] == "--connection-string")
            return args[i + 1];
    }
    return null;
}

static Guid NewSortableGuid() => Uuid.NewDatabaseFriendly(Database.SqlServer);

static async Task BackfillHierarchiesNewIds(SqlConnection conn, SqlTransaction tx, Dictionary<int, Guid> rootMap)
{
    var ids = await ReadInts(conn, tx, "SELECT Id FROM Hierarchies WHERE NewId IS NULL");
    Console.WriteLine($"Hierarchies: minting Guids for {ids.Count} rows");

    foreach (var id in ids)
    {
        var guid = rootMap.TryGetValue(id, out var seed) ? seed : NewSortableGuid();
        await Exec(conn, tx, "UPDATE Hierarchies SET NewId = @g WHERE Id = @id",
            ("@g", guid), ("@id", id));
    }
}

static async Task BackfillLeafNewIds(SqlConnection conn, SqlTransaction tx, string table)
{
    var ids = await ReadInts(conn, tx, $"SELECT Id FROM {table} WHERE NewId IS NULL");
    Console.WriteLine($"{table}: minting Guids for {ids.Count} rows");

    foreach (var id in ids)
    {
        await Exec(conn, tx, $"UPDATE {table} SET NewId = @g WHERE Id = @id",
            ("@g", NewSortableGuid()), ("@id", id));
    }
}

// Bulk variant for large tables (Records, OperationCriteria,
// RecordOperationCriteria). Stages (oldId, newId) pairs in a temp table
// via SqlBulkCopy in 10k chunks, then runs a single UPDATE...FROM JOIN.
// Memory-friendly and avoids 200k+ round-trips.
static async Task BackfillLeafNewIdsBulk(SqlConnection conn, SqlTransaction tx, string table)
{
    var ids = await ReadInts(conn, tx, $"SELECT Id FROM {table} WHERE NewId IS NULL");
    Console.WriteLine($"{table}: bulk-minting Guids for {ids.Count} rows");
    if (ids.Count == 0) return;

    await Exec(conn, tx, "CREATE TABLE #IdMap (OldId int PRIMARY KEY, NewId uniqueidentifier NOT NULL)");
    try
    {
        var dt = new System.Data.DataTable();
        dt.Columns.Add("OldId", typeof(int));
        dt.Columns.Add("NewId", typeof(Guid));
        foreach (var id in ids)
        {
            dt.Rows.Add(id, NewSortableGuid());
        }

        using (var bulk = new SqlBulkCopy(conn, SqlBulkCopyOptions.Default, tx)
        {
            DestinationTableName = "#IdMap",
            BatchSize = 10_000,
            BulkCopyTimeout = 600,
        })
        {
            bulk.ColumnMappings.Add("OldId", "OldId");
            bulk.ColumnMappings.Add("NewId", "NewId");
            await bulk.WriteToServerAsync(dt);
        }

        var updated = await Exec(conn, tx,
            $"UPDATE t SET NewId = m.NewId FROM {table} t INNER JOIN #IdMap m ON m.OldId = t.Id WHERE t.NewId IS NULL");
        Console.WriteLine($"{table}: {updated} rows backfilled in bulk");
    }
    finally
    {
        await Exec(conn, tx, "DROP TABLE #IdMap");
    }
}

static async Task InsertMetaForHierarchies(SqlConnection conn, SqlTransaction tx)
{
    var sql = @"
INSERT INTO Meta (Id, Metatype, Owner, [Groups], Created, Deleted)
SELECT h.NewId, 'Directory',
       COALESCE(h.Owner, 'system'),
       CASE WHEN h.IsPublic = 1 OR h.[Group] IS NULL OR LTRIM(RTRIM(h.[Group])) = ''
            THEN '[]'
            ELSE '[""' + REPLACE(h.[Group], '""', '\""') + '""]'
       END,
       SYSUTCDATETIME(),
       CASE WHEN h.IsActive = 0 THEN SYSUTCDATETIME() ELSE NULL END
FROM Hierarchies h
LEFT JOIN Meta m ON m.Id = h.NewId
WHERE m.Id IS NULL;";
    var rows = await Exec(conn, tx, sql);
    Console.WriteLine($"Meta(Directory): {rows} rows inserted");
}

static async Task InsertMetaForLeaf(SqlConnection conn, SqlTransaction tx, string table, string metatype)
{
    var sql = $@"
INSERT INTO Meta (Id, Metatype, Owner, [Groups], Created, Deleted)
SELECT t.NewId, '{metatype}', 'system', '[]', SYSUTCDATETIME(),
       CASE WHEN t.IsActive = 0 THEN SYSUTCDATETIME() ELSE NULL END
FROM {table} t
LEFT JOIN Meta m ON m.Id = t.NewId
WHERE m.Id IS NULL;";
    var rows = await Exec(conn, tx, sql);
    Console.WriteLine($"Meta({metatype}): {rows} rows inserted");
}

// Same shape as InsertMetaForLeaf — currently identical, but kept separate so
// later phases can layer per-entity metadata (Profile keeps text-json metadata,
// Qualifier has no Owner column, etc.). Detects whether the source table has
// an IsActive column so it works for both TypeObject-derived (Profile/Audit/...)
// and plain LegacyIntDomainObject (Record) entities.
static async Task InsertMetaForLegacyEntity(SqlConnection conn, SqlTransaction tx, string table, string metatype)
{
    var hasIsActive = await ColumnExists(conn, tx, table, "IsActive");
    var deletedExpr = hasIsActive
        ? "CASE WHEN t.IsActive = 0 THEN SYSUTCDATETIME() ELSE NULL END"
        : "NULL";
    var sql = $@"
INSERT INTO Meta (Id, Metatype, Owner, [Groups], Created, Deleted)
SELECT t.NewId, '{metatype}', 'system', '[]', SYSUTCDATETIME(),
       {deletedExpr}
FROM {table} t
LEFT JOIN Meta m ON m.Id = t.NewId
WHERE m.Id IS NULL;";
    var rows = await Exec(conn, tx, sql);
    Console.WriteLine($"Meta({metatype}): {rows} rows inserted");
}

static async Task InsertDirectoriesForHierarchies(SqlConnection conn, SqlTransaction tx)
{
    // Two passes so the self-ref FK never references a not-yet-inserted parent:
    // pass 1 inserts roots (ParentId IS NULL), pass 2 inserts the rest.
    var rootsSql = @"
INSERT INTO Directories (Id, DirectoryId, Name, Description)
SELECT h.NewId, NULL, h.Name, h.Description
FROM Hierarchies h
LEFT JOIN Directories d ON d.Id = h.NewId
WHERE h.ParentId IS NULL AND d.Id IS NULL;";
    Console.WriteLine($"Directories (root Hierarchies): {await Exec(conn, tx, rootsSql)} rows");

    var nonRootsSql = @"
INSERT INTO Directories (Id, DirectoryId, Name, Description)
SELECT h.NewId, p.NewId, h.Name, h.Description
FROM Hierarchies h
INNER JOIN Hierarchies p ON p.Id = h.ParentId
LEFT JOIN Directories d ON d.Id = h.NewId
WHERE d.Id IS NULL;";
    Console.WriteLine($"Directories (child Hierarchies): {await Exec(conn, tx, nonRootsSql)} rows");
}

static async Task BackfillLeafNewDirectoryId(SqlConnection conn, SqlTransaction tx, string table)
{
    var sql = $@"
UPDATE t SET NewDirectoryId = h.NewId
FROM {table} t INNER JOIN Hierarchies h ON h.Id = t.HierarchyId
WHERE t.NewDirectoryId IS NULL;";
    Console.WriteLine($"{table}.NewDirectoryId: {await Exec(conn, tx, sql)} rows backfilled");
}

static async Task BackfillIndirectFk(SqlConnection conn, SqlTransaction tx,
    string table, string newCol, string oldCol, string targetTable)
{
    var sql = $@"
UPDATE t SET {newCol} = x.NewId
FROM {table} t INNER JOIN {targetTable} x ON x.Id = t.{oldCol}
WHERE t.{newCol} IS NULL;";
    Console.WriteLine($"{table}.{newCol}: {await Exec(conn, tx, sql)} rows backfilled");
}

static async Task<bool> TableExists(SqlConnection conn, SqlTransaction tx, string table)
{
    await using var cmd = new SqlCommand(
        "SELECT COUNT(*) FROM sys.tables WHERE name = @t", conn, tx);
    cmd.Parameters.AddWithValue("@t", table);
    return ((int)(await cmd.ExecuteScalarAsync())!) > 0;
}

static async Task<bool> ColumnExists(SqlConnection conn, SqlTransaction tx, string table, string column)
{
    await using var cmd = new SqlCommand(
        @"SELECT COUNT(*) FROM sys.columns c
          INNER JOIN sys.tables t ON t.object_id = c.object_id
          WHERE t.name = @t AND c.name = @c", conn, tx);
    cmd.Parameters.AddWithValue("@t", table);
    cmd.Parameters.AddWithValue("@c", column);
    return ((int)(await cmd.ExecuteScalarAsync())!) > 0;
}

static async Task<List<int>> ReadInts(SqlConnection conn, SqlTransaction tx, string sql)
{
    await using var cmd = new SqlCommand(sql, conn, tx);
    await using var r = await cmd.ExecuteReaderAsync();
    var ids = new List<int>();
    while (await r.ReadAsync()) ids.Add(r.GetInt32(0));
    return ids;
}

static async Task<int> Exec(SqlConnection conn, SqlTransaction tx, string sql, params (string Name, object Value)[] parameters)
{
    await using var cmd = new SqlCommand(sql, conn, tx);
    foreach (var (name, value) in parameters)
        cmd.Parameters.AddWithValue(name, value);
    return await cmd.ExecuteNonQueryAsync();
}
