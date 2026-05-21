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
    await InsertDirectoriesForLeaf(conn, tx, "Hosts");
    await InsertDirectoriesForLeaf(conn, tx, "Devices");
    await InsertDirectoriesForLeaf(conn, tx, "Processes");
    await InsertDirectoriesForLeaf(conn, tx, "Workplaces");

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

static async Task InsertDirectoriesForLeaf(SqlConnection conn, SqlTransaction tx, string table)
{
    var sql = $@"
INSERT INTO Directories (Id, DirectoryId, Name, Description)
SELECT t.NewId, h.NewId, t.Name, t.Description
FROM {table} t
INNER JOIN Hierarchies h ON h.Id = t.HierarchyId
LEFT JOIN Directories d ON d.Id = t.NewId
WHERE d.Id IS NULL;";
    Console.WriteLine($"Directories ({table}): {await Exec(conn, tx, sql)} rows");
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
