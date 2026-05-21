using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Microprojects.Edm.Shared.Persistence;
using Microprojects.Edm.Ui.Technologies.Models;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Microprojects.Edm.Ui.Technologies.Persistence
{
    public class TechnologiesContext : SharedDbContext
    {
        public DbSet<Audit> Audits { get; set; }
        public DbSet<AuditZone> AuditZones { get; set; }
        public DbSet<AuditCriterion> AuditCriteria { get; set; }
        public DbSet<Device> Devices { get; set; }
        public DbSet<Hierarchy> Hierarchies { get; set; }
        public DbSet<Host> Hosts { get; set; }
        public DbSet<HostDevice> HostDevices { get; set; }
        public DbSet<Operation> Operations { get; set; }
        public DbSet<OperationCriterion> OperationCriteria { get; set; }
        public DbSet<OperationHostDevice> OperationHostDevices { get; set; }
        public DbSet<Process> Processes { get; set; }
        public DbSet<Profile> Profiles { get; set; }
        public DbSet<Qualifier> Qualifiers { get; set; }
        public DbSet<Record> Records { get; set; }
        public DbSet<RecordOperationCriterion> RecordOperationCriteria { get; set; }
        public DbSet<Setting> Settings { get; set; }
        public DbSet<Workbench> Workbenches { get; set; }
        public DbSet<WorkbenchWorkplaceHostDevice> WorkbenchDeviceConfigurations { get; set; }
        public DbSet<Workplace> Workplaces { get; set; }
        public DbSet<WorkplaceHostDevice> WorkplaceHostDevices { get; set; }
        public DbSet<WorkplaceProcess> WorkplaceProcesses { get; set; }

        public TechnologiesContext(DbContextOptions<TechnologiesContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Audit>().HasMany(a => a.Qualifiers).WithMany();

            // Parameters is a Dictionary<string, object> round-tripped as JSON.
            // On SQL Server the column defaults to nvarchar(max), which is what
            // the existing schema already has.
            modelBuilder.Entity<Record>()
                .Property(e => e.Parameters)
                .HasConversion(
                    d => JsonConvert.SerializeObject(d),
                    s => JsonConvert.DeserializeObject<Dictionary<string, object>>(s),
                    ValueComparer.CreateDefault<Dictionary<string, object>>(false)
                );
        }
    }
}
