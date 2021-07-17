using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Optosense.Edm.DataAccess
{
    public class EdmContext : DbContext, IEdmContext, IOwnedEdmContext
    {
        private string _connectionString;

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
        public DbSet<Record> Records { get; set; }
        public DbSet<RecordOperationCriterion> RecordOperationCriteria { get; set; }
        public DbSet<Setting> Settings { get; set; }
        public DbSet<Workbench> Workbenches { get; set; }
        public DbSet<WorkbenchWorkplaceHostDevice> WorkbenchDeviceConfigurations { get; set; }
        public DbSet<Workplace> Workplaces { get; set; }
        public DbSet<WorkplaceHostDevice> WorkplaceHostDevices { get; set; }
        public DbSet<WorkplaceProcess> WorkplaceProcesses{ get; set; }

        public EdmContext()
        {
        }

        public EdmContext(DbContextOptions options) : base(options)
        {
        }

        public EdmContext(string conn)
        {
            _connectionString = conn;
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlServer(_connectionString ?? "Data Source=.\\SQLEXPRESS;MultipleActiveResultSets=true;Initial Catalog=optosense_edm;Integrated Security=SSPI;");
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            //modelBuilder.Entity<HostDevice>()
            //    .HasKey(hd => new { hd.HostId, hd.DeviceId});
            //modelBuilder.Entity<HostDevice>()
            //    .HasOne(hd => hd.Host)
            //    .WithMany(h => h.Devices)
            //    .HasForeignKey(hd => hd.HostId);
            //modelBuilder.Entity<HostDevice>()
            //    .HasOne(hd => hd.Device)
            //    .WithMany(d => d.Hosts)
            //    .HasForeignKey(hd => hd.DeviceId);
        }
    }
}
