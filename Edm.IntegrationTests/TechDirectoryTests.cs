using Microprojects.Edm;
using Microprojects.Edm.Auth;
using Microprojects.Edm.Domain;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Services;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Microprojects.Edm.Ui.Technologies.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Directory = Microprojects.Edm.Domain.Directory;

namespace Edm.IntegrationTests;

// Service-level tests for the Tech directory unification (Phase A–G):
// every Tech entity is Guid-keyed, IWithMeta lifecycle entities filter
// soft-deleted rows, and the shared DirectoriesController/DirectoryService
// place leaves under WellKnownDirectoryIds-rooted folders.
public class TechDirectoryTests
{
    private static TechnologiesContext NewContext()
    {
        var options = new DbContextOptionsBuilder<TechnologiesContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new TechnologiesContext(options);
    }

    private static Meta NewMeta(Guid id, string metatype, DateTime? deleted = null) =>
        new() { Id = id, Metatype = metatype, Owner = "test", Deleted = deleted };

    private sealed class StubUserService : IUserService
    {
        public string? GetUserName() => "test";
        public string[] GetUserGroups() => [];
        public string? GetUserRole() => EdmRoles.Admin;
        public bool IsAdmin() => true;
    }

    private sealed class StubDirectoryRootRegistry : IDirectoryRootRegistry
    {
        private static readonly Guid[] Roots =
        [
            WellKnownDirectoryIds.Hosts,
            WellKnownDirectoryIds.Devices,
            WellKnownDirectoryIds.Processes,
            WellKnownDirectoryIds.Workplaces,
        ];

        public IReadOnlyList<Guid> TypeRoots => Roots;

        public bool IsTypeRoot(Guid id) =>
            id != WellKnownDirectoryIds.GeneralRoot && Roots.Contains(id);

        public Guid? ResolveRoot(string entryType, string? kind = null) =>
            WellKnownDirectoryIds.ResolveRoot(entryType);
    }

    private static async Task<TechnologiesContext> SeedRootsAsync(TechnologiesContext db)
    {
        // Mirrors the shape the TechHierarchyBackfill tool installed on the dev DB:
        // GeneralRoot at the top, then four type-roots, each with its own Meta row
        // (Owner=system, Groups=empty, no Deleted).
        Directory MakeRoot(Guid id, string name, Guid? parent) => new()
        {
            Id = id,
            Name = name,
            DirectoryId = parent,
            Meta = NewMeta(id, nameof(Directory)),
        };

        db.Directories.AddRange(
            MakeRoot(WellKnownDirectoryIds.GeneralRoot, "Root", null),
            MakeRoot(WellKnownDirectoryIds.Hosts, "Hosts", WellKnownDirectoryIds.GeneralRoot),
            MakeRoot(WellKnownDirectoryIds.Devices, "Devices", WellKnownDirectoryIds.GeneralRoot),
            MakeRoot(WellKnownDirectoryIds.Processes, "Processes", WellKnownDirectoryIds.GeneralRoot),
            MakeRoot(WellKnownDirectoryIds.Workplaces, "Workplaces", WellKnownDirectoryIds.GeneralRoot));
        await db.SaveChangesAsync();
        return db;
    }

    [Fact]
    public async Task DirectoryService_GetSubtreeFolders_includes_root_and_descendants()
    {
        await using var db = await SeedRootsAsync(NewContext());

        // Add a Hosts/dev-station folder under the Hosts root.
        var devStationId = Guid.NewGuid();
        db.Directories.Add(new Directory
        {
            Id = devStationId,
            Name = "Dev station",
            DirectoryId = WellKnownDirectoryIds.Hosts,
            Meta = NewMeta(devStationId, nameof(Directory)),
        });
        // Add a folder under a different root — it must NOT appear in the
        // Hosts-rooted subtree.
        var unrelatedId = Guid.NewGuid();
        db.Directories.Add(new Directory
        {
            Id = unrelatedId,
            Name = "Pasteurizers",
            DirectoryId = WellKnownDirectoryIds.Devices,
            Meta = NewMeta(unrelatedId, nameof(Directory)),
        });
        await db.SaveChangesAsync();

        var svc = new DirectoryService<TechnologiesContext>(db, new StubUserService(), new StubDirectoryRootRegistry());
        var folders = (await svc.GetSubtreeFolders(WellKnownDirectoryIds.Hosts)).ToList();

        Assert.Contains(folders, d => d.Id == WellKnownDirectoryIds.Hosts);
        Assert.Contains(folders, d => d.Id == devStationId);
        Assert.DoesNotContain(folders, d => d.Id == unrelatedId);
    }

    [Fact]
    public async Task DirectoryService_GetSubtreeFolders_excludes_soft_deleted_folder()
    {
        await using var db = await SeedRootsAsync(NewContext());
        var keepId = Guid.NewGuid();
        var dropId = Guid.NewGuid();
        db.Directories.AddRange(
            new Directory
            {
                Id = keepId,
                Name = "Kept",
                DirectoryId = WellKnownDirectoryIds.Hosts,
                Meta = NewMeta(keepId, nameof(Directory)),
            },
            new Directory
            {
                Id = dropId,
                Name = "Gone",
                DirectoryId = WellKnownDirectoryIds.Hosts,
                Meta = NewMeta(dropId, nameof(Directory), deleted: DateTime.UtcNow),
            });
        await db.SaveChangesAsync();

        var svc = new DirectoryService<TechnologiesContext>(db, new StubUserService(), new StubDirectoryRootRegistry());
        var folders = (await svc.GetSubtreeFolders(WellKnownDirectoryIds.Hosts)).ToList();

        Assert.Contains(folders, d => d.Id == keepId);
        Assert.DoesNotContain(folders, d => d.Id == dropId);
    }

    [Fact]
    public async Task DirectoryService_ChangeParent_rejects_cross_type_root_moves()
    {
        await using var db = await SeedRootsAsync(NewContext());

        var srcId = Guid.NewGuid();
        var dstId = Guid.NewGuid();
        db.Directories.AddRange(
            new Directory
            {
                Id = srcId,
                Name = "Inner Hosts folder",
                DirectoryId = WellKnownDirectoryIds.Hosts,
                Meta = NewMeta(srcId, nameof(Directory)),
            },
            new Directory
            {
                Id = dstId,
                Name = "Inner Devices folder",
                DirectoryId = WellKnownDirectoryIds.Devices,
                Meta = NewMeta(dstId, nameof(Directory)),
            });
        await db.SaveChangesAsync();

        var svc = new DirectoryService<TechnologiesContext>(db, new StubUserService(), new StubDirectoryRootRegistry());

        // Moving a Hosts-rooted folder under Devices must throw — folders can't
        // cross between type roots.
        await Assert.ThrowsAsync<EdmException>(() => svc.ChangeParent(srcId, dstId));
    }

    [Fact]
    public async Task DirectoryService_ChangeParent_rejects_built_in_root_moves()
    {
        await using var db = await SeedRootsAsync(NewContext());
        var dstId = Guid.NewGuid();
        db.Directories.Add(new Directory
        {
            Id = dstId,
            Name = "Some folder",
            DirectoryId = WellKnownDirectoryIds.Devices,
            Meta = NewMeta(dstId, nameof(Directory)),
        });
        await db.SaveChangesAsync();

        var svc = new DirectoryService<TechnologiesContext>(db, new StubUserService(), new StubDirectoryRootRegistry());

        // The Hosts type root itself is built-in and must refuse to move.
        await Assert.ThrowsAsync<EdmException>(
            () => svc.ChangeParent(WellKnownDirectoryIds.Hosts, dstId));
    }

    [Fact]
    public async Task ServiceBase_Save_assigns_id_and_meta_for_new_IWithMeta_entity()
    {
        await using var db = await SeedRootsAsync(NewContext());

        // Workbench is IWithMeta. A newly-constructed entity comes in with
        // Id == Guid.Empty; the shared ServiceBase.Save() mints a Guid and
        // attaches a fresh Meta row.
        var unsaved = new Workbench
        {
            Id = Guid.Empty,
            Name = "Bench-1",
            WorkplaceProcessId = Guid.NewGuid(),
            CommonUid = "WB-1",
            Meta = null!,
        };

        var svc = new WorkplaceService(db, new StubUserService());
        var saved = await svc.SaveWorkbench(unsaved);

        Assert.NotEqual(Guid.Empty, saved.Id);
        var meta = await db.Meta.FirstOrDefaultAsync(m => m.Id == saved.Id);
        Assert.NotNull(meta);
        Assert.Equal(nameof(Workbench), meta!.Metatype);
        Assert.Null(meta.Deleted);
    }

    [Fact]
    public void LogisticsDirectoryRootRegistry_resolves_Nomenclature_root()
    {
        // The lifted EntriesControllerBase calls
        // RootRegistry.ResolveRoot(typeof(TEntry).Name, kind). For TEntry =
        // Nomenclature, that's ResolveRoot("Nomenclature", null). The Logistics
        // registry must return the Nomenclatures root Guid, not null.
        var reg = new Microprojects.Edm.Ui.Logistics.Services.LogisticsDirectoryRootRegistry();
        var result = reg.ResolveRoot(typeof(Microprojects.Edm.Ui.Logistics.Models.Nomenclature).Name, null);
        Assert.NotNull(result);
        Assert.Equal(Microprojects.Edm.Ui.Logistics.Models.WellKnownDirectoryIds.Nomenclatures, result);
    }

    [Fact]
    public void CompositeDirectoryRootRegistry_resolves_both_plugins()
    {
        // Regression for the bug that broke /api/logistics/nomenclatures/hierarchy:
        // both Tech and Logistics each register their own IDirectoryRootRegistry in
        // the host service collection, and last-write-wins meant Logistics's
        // controllers would receive Tech's registry (which doesn't know
        // "Nomenclature") at runtime. The composite walks all plugin registries
        // so both plugins resolve their own entry types regardless of registration
        // order.
        IPluginDirectoryRootRegistry logistics = new Microprojects.Edm.Ui.Logistics.Services.LogisticsDirectoryRootRegistry();
        IPluginDirectoryRootRegistry tech = new Microprojects.Edm.Ui.Technologies.Services.TechDirectoryRootRegistry();
        var composite = new CompositeDirectoryRootRegistry([tech, logistics]);

        Assert.Equal(
            Microprojects.Edm.Ui.Logistics.Models.WellKnownDirectoryIds.Nomenclatures,
            composite.ResolveRoot("Nomenclature"));
        Assert.Equal(WellKnownDirectoryIds.Hosts, composite.ResolveRoot("hosts"));
        Assert.Null(composite.ResolveRoot("Unknown"));
        Assert.True(composite.IsTypeRoot(WellKnownDirectoryIds.Hosts));
        Assert.True(composite.IsTypeRoot(Microprojects.Edm.Ui.Logistics.Models.WellKnownDirectoryIds.Nomenclatures));
    }
}
