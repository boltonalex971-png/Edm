using Microprojects.Edm.Domain;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Shared.Persistence;

// Base DbContext for plugins that participate in the unified Directory/Meta
// model. Owns the three shared tables (Meta, History, Directories) and the
// reflective ID/Meta wiring. Plugin contexts inherit, add their own DbSets,
// and chain base.OnModelCreating before their plugin-specific fluent config.
public abstract class SharedDbContext : DbContext
{
    public DbSet<Meta> Meta { get; set; }
    public DbSet<History> History { get; set; }
    public DbSet<Directory> Directories { get; set; }

    protected SharedDbContext()
    {
    }

    protected SharedDbContext(DbContextOptions options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ConfigureGuidIdsValueGeneratedNever();
        builder.ConfigureMetaEntities();
    }
}
