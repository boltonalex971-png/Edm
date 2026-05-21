using Microprojects.Edm.Shared.Persistence;
using Microprojects.Edm.Ui.Logistics.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Directory = Microprojects.Edm.Domain.Directory;

namespace Microprojects.Edm.Ui.Logistics.Persistence;

public class LogisticsContext : SharedDbContext
{
    public DbSet<Changelog> Changelog { get; set; }
    public DbSet<Item> Items { get; set; }
    public DbSet<Supply> Supplies { get; set; }
    public DbSet<Nomenclature> Nomenclatures { get; set; }
    public DbSet<Process> Processes { get; set; }
    public DbSet<Grade> Grades { get; set; }
    public DbSet<SubProcess> SubProcesses { get; set; }
    public DbSet<Specification> Specifications { get; set; }
    public DbSet<SpecificationNomenclature> SpecificationNomenclatures { get; set; }
    public DbSet<OrderSpecificationNomenclature> OrderSpecificationNomenclatures { get; set; }
    public DbSet<Tare> Tares { get; set; }
    public DbSet<TareType> TareTypes { get; set; }
    public DbSet<NomenclatureTareType> NomenclatureTareTypes { get; set; }
    public DbSet<Assignment> Tasks { get; set; }
    public DbSet<ItemLink> ItemLinks { get; set; }

    public LogisticsContext(DbContextOptions<LogisticsContext> options) : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        //builder.Entity<Meta>().OwnsOne(m => m.Groups).ToJson();
        // builder.Entity<Meta>()
        //     .Property(e => e.Groups)
        //     .HasColumnType("nvarchar(max)")
        //     .HasConversion(
        //         d => JsonConvert.SerializeObject(d),
        //         s => JsonConvert.DeserializeObject<string[]>(s ?? "[]")
        //     );

        builder.Entity<TareType>().Ignore(t => t.Dimensions);

        // Self-referencing relation to build process tree
        builder.Entity<Process>()
            .HasMany(p => p.SubProcesses)
            .WithOne(s => s.Process)
            .HasForeignKey(s => s.ProcessId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.Entity<SubProcess>()
            .ToTable("SubProcesses")
            .HasOne(s => s.LinkedProcess)
            .WithMany()
            .HasForeignKey(s => s.LinkedProcessId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Order>()
            .HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(op => op.OrderId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.Entity<Order>()
            .HasOne(o => o.Process)
            .WithMany()
            .HasForeignKey(op => op.ProcessId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Supply>()
            .HasMany(s => s.Items)
            .WithOne(i => i.Supply)
            .HasForeignKey(i => i.SupplyId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<OrderProcess>()
            .HasOne(o => o.Process)
            .WithMany()
            .HasForeignKey(op => op.ProcessId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.Entity<OrderProcess>()
            .HasOne(o => o.Order)
            .WithMany(o => o.Processes)
            .HasForeignKey(op => op.OrderId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<OrderSpecificationNomenclature>()
            .HasOne(s => s.Order)
            .WithMany()
            .HasForeignKey(s => s.OrderId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.Entity<OrderSpecificationNomenclature>()
            .HasOne(s => s.Nomenclature)
            .WithMany()
            .HasForeignKey(s => s.NomenclatureId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.Entity<OrderSpecificationNomenclature>()
            .HasOne(s => s.Process)
            .WithMany()
            .HasForeignKey(s => s.ProcessId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.Entity<OrderSpecificationNomenclature>()
            .HasIndex(s => new { s.OrderId, s.NomenclatureId });

        builder.Entity<Item>()
            .HasOne(i => i.Grade)
            .WithMany()
            .HasForeignKey(i => i.GradeId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<ItemLink>()
            .HasOne(l => l.OrderProcess)
            .WithMany()
            .HasForeignKey(l => l.OrderProcessId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);
        builder.Entity<ItemLink>()
            .HasOne(l => l.SourceItem)
            .WithMany()
            .HasForeignKey(l => l.SourceItemId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.Entity<ItemLink>()
            .HasOne(l => l.TargetItem)
            .WithMany()
            .HasForeignKey(l => l.TargetItemId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<NomenclatureTareType>()
            .HasOne(x => x.Nomenclature)
            .WithMany(n => n.AllowedTareTypes)
            .HasForeignKey(x => x.NomenclatureId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<NomenclatureTareType>()
            .HasOne(x => x.TareType)
            .WithMany()
            .HasForeignKey(x => x.TareTypeId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Entity<NomenclatureTareType>()
            .HasIndex(x => new { x.NomenclatureId, x.TareTypeId })
            .IsUnique();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
    {
        return base.SaveChangesAsync(cancellationToken);
    }

}