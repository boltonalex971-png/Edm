using Microprojects.Edm.Ui.Logistics.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;

namespace Microprojects.Edm.Ui.Logistics.Persistence;

public class LogisticsContext : DbContext
{
    public DbSet<Changelog> Changelog { get; set; }
    public DbSet<Meta> Meta { get; set; }
    public DbSet<Directory> Directories { get; set; }
    public DbSet<Item> Items { get; set; }
    public DbSet<Nomenclature> Nomenclatures { get; set; }
    public DbSet<Process> Processes { get; set; }
    public DbSet<SubProcess> SubProcesses { get; set; }
    public DbSet<Specification> Specifications { get; set; }
    public DbSet<SpecificationNomenclature> SpecificationNomenclatures { get; set; }
    public DbSet<Tare> Tares { get; set; }
    public DbSet<TareType> TareTypes { get; set; }
    public DbSet<Assignment> Tasks { get; set; }
    
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

        // Foreign keys for tables with metainfo
        ConfigureMetaEntities(builder);

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

        builder.Entity<OrderProcess>()
            .HasOne(o => o.Process)
            .WithMany()
            .HasForeignKey(op => op.ProcessId)
            .OnDelete(DeleteBehavior.NoAction);
        builder.Entity<OrderProcess>()
            .HasOne(o => o.Order)
            .WithMany()
            .HasForeignKey(op => op.OrderId)
            .OnDelete(DeleteBehavior.NoAction);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
    {
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ConfigureMetaEntities(ModelBuilder builder)
    {
        var entityTypes = builder.Model.GetEntityTypes()
            .Where(t => typeof(IWithMeta).IsAssignableFrom(t.ClrType))
            .Select(t => t.ClrType);

        foreach (var entityType in entityTypes)
        {
            builder.Entity(entityType)
                .HasOne(nameof(IWithMeta.Meta))
                .WithOne()
                .HasForeignKey(entityType.Name, nameof(DomainObject.Id))
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}