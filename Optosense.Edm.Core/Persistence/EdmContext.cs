using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Optosense.Edm.Persistence
{
    public class EdmContext : DbContext
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
        public DbSet<Record> Records { get; set; }
        public DbSet<RecordOperationCriterion> RecordOperationCriteria { get; set; }
        public DbSet<Setting> Settings { get; set; }
        public DbSet<Workbench> Workbenches { get; set; }
        public DbSet<WorkbenchWorkplaceHostDevice> WorkbenchDeviceConfigurations { get; set; }
        public DbSet<Workplace> Workplaces { get; set; }
        public DbSet<WorkplaceHostDevice> WorkplaceHostDevices { get; set; }
        public DbSet<WorkplaceProcess> WorkplaceProcesses{ get; set; }

        public EdmContext(DbContextOptions<EdmContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
        }
    }
}
