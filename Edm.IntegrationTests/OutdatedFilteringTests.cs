using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Microprojects.Edm.Ui.Logistics.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Edm.IntegrationTests;

// Service-level tests for the outdated-entity filtering policy: an entity with
// Meta.Completed != null was superseded by an auto-fork and must not appear in
// the master tree, in pickers, or as the linked side of any relation row.
public class OutdatedFilteringTests
{
    private static LogisticsContext NewContext()
    {
        var options = new DbContextOptionsBuilder<LogisticsContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new LogisticsContext(options);
    }

    private static Meta NewMeta(Guid id, string metatype, DateTime? completed = null) =>
        new() { Id = id, Metatype = metatype, Owner = "test", Completed = completed };

    private static Nomenclature NewNomenclature(string name, DateTime? completed = null)
    {
        var id = Guid.NewGuid();
        return new Nomenclature
        {
            Id = id,
            Name = name,
            Category = NomenclatureCategories.Part,
            Countable = true,
            Meta = NewMeta(id, nameof(Nomenclature), completed),
        };
    }

    private static TareType NewTareType(string name, DateTime? completed = null)
    {
        var id = Guid.NewGuid();
        return new TareType
        {
            Id = id,
            Name = name,
            Units = "pcs",
            Meta = NewMeta(id, nameof(TareType), completed),
        };
    }

    private static Process NewProcess(string name, DateTime? completed = null)
    {
        var id = Guid.NewGuid();
        return new Process
        {
            Id = id,
            Name = name,
            Kind = ProcessKinds.Manufacturing,
            Meta = NewMeta(id, nameof(Process), completed),
        };
    }

    private sealed class StubUserService : IUserService
    {
        public string? GetUserName() => "test";
        public string[] GetUserGroups() => [];
        public string? GetUserRole() => "Admin";
    }

    [Fact]
    public async Task Nomenclature_GetAll_excludes_outdated()
    {
        await using var db = NewContext();
        var active = NewNomenclature("Active");
        var outdated = NewNomenclature("Outdated", completed: DateTime.UtcNow);
        db.Nomenclatures.AddRange(active, outdated);
        await db.SaveChangesAsync();

        var svc = new NomenclatureService(db, new StubUserService());
        var result = await svc.GetAll();

        Assert.Contains(result, n => n.Id == active.Id);
        Assert.DoesNotContain(result, n => n.Id == outdated.Id);
    }

    [Fact]
    public async Task GetAllowedTareTypes_drops_link_to_outdated_tare_type()
    {
        await using var db = NewContext();
        var nomenclature = NewNomenclature("Bolt");
        var activeTare = NewTareType("Active box");
        var outdatedTare = NewTareType("Old box", completed: DateTime.UtcNow);
        db.Nomenclatures.Add(nomenclature);
        db.TareTypes.AddRange(activeTare, outdatedTare);
        db.NomenclatureTareTypes.AddRange(
            new NomenclatureTareType { Id = Guid.NewGuid(), NomenclatureId = nomenclature.Id, TareTypeId = activeTare.Id },
            new NomenclatureTareType { Id = Guid.NewGuid(), NomenclatureId = nomenclature.Id, TareTypeId = outdatedTare.Id });
        await db.SaveChangesAsync();

        var svc = new NomenclatureService(db, new StubUserService());
        var result = (await svc.GetAllowedTareTypes(nomenclature.Id)).ToList();

        Assert.Single(result);
        Assert.Equal(activeTare.Id, result[0].TareTypeId);
    }

    [Fact]
    public async Task GetAllowedNomenclatures_drops_link_to_outdated_nomenclature()
    {
        await using var db = NewContext();
        var tare = NewTareType("Pallet");
        var activeNom = NewNomenclature("Bolt v2");
        var outdatedNom = NewNomenclature("Bolt v1", completed: DateTime.UtcNow);
        db.TareTypes.Add(tare);
        db.Nomenclatures.AddRange(activeNom, outdatedNom);
        db.NomenclatureTareTypes.AddRange(
            new NomenclatureTareType { Id = Guid.NewGuid(), TareTypeId = tare.Id, NomenclatureId = activeNom.Id },
            new NomenclatureTareType { Id = Guid.NewGuid(), TareTypeId = tare.Id, NomenclatureId = outdatedNom.Id });
        await db.SaveChangesAsync();

        var svc = new TareTypeService(db, new StubUserService());
        var result = (await svc.GetAllowedNomenclatures(tare.Id)).ToList();

        Assert.Single(result);
        Assert.Equal(activeNom.Id, result[0].NomenclatureId);
    }

    [Fact]
    public async Task GetSubProcesses_drops_link_to_outdated_linked_process()
    {
        await using var db = NewContext();
        var parent = NewProcess("Parent");
        var activeChild = NewProcess("Child v2");
        var outdatedChild = NewProcess("Child v1", completed: DateTime.UtcNow);
        db.Processes.AddRange(parent, activeChild, outdatedChild);
        db.SubProcesses.AddRange(
            new SubProcess { Id = Guid.NewGuid(), ProcessId = parent.Id, LinkedProcessId = activeChild.Id, Order = 10 },
            new SubProcess { Id = Guid.NewGuid(), ProcessId = parent.Id, LinkedProcessId = outdatedChild.Id, Order = 20 });
        await db.SaveChangesAsync();

        var svc = new ProcessService(db, new StubUserService(), new SpecificationService(db, new StubUserService()));
        var result = (await svc.GetSubProcesses(parent.Id)).ToList();

        Assert.Single(result);
        Assert.Equal(activeChild.Id, result[0].LinkedProcessId);
    }

    [Fact]
    public async Task GetActiveSpecification_drops_rows_with_outdated_nomenclature()
    {
        await using var db = NewContext();
        var process = NewProcess("Make widget");
        var activeNom = NewNomenclature("Steel");
        var outdatedNom = NewNomenclature("Old steel grade", completed: DateTime.UtcNow);
        db.Processes.Add(process);
        db.Nomenclatures.AddRange(activeNom, outdatedNom);

        var spec = new Specification
        {
            Id = Guid.NewGuid(),
            Name = "main",
            Active = true,
            ProcessId = process.Id,
            Meta = NewMeta(Guid.NewGuid(), nameof(Specification)),
        };
        db.Specifications.Add(spec);
        db.SpecificationNomenclatures.AddRange(
            new SpecificationNomenclature { Id = Guid.NewGuid(), SpecificationId = spec.Id, NomenclatureId = activeNom.Id, Quantity = 1 },
            new SpecificationNomenclature { Id = Guid.NewGuid(), SpecificationId = spec.Id, NomenclatureId = outdatedNom.Id, Quantity = 2 });
        await db.SaveChangesAsync();

        var svc = new ProcessService(db, new StubUserService(), new SpecificationService(db, new StubUserService()));
        var result = await svc.GetActiveSpecification(process.Id);

        Assert.NotNull(result);
        Assert.Single(result!.Rows);
        Assert.Equal(activeNom.Id, result.Rows.First().NomenclatureId);
    }
}
