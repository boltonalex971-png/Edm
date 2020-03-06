using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Optosense.Edm.DataAccess
{
    public class EdmContext : DbContext
    {
        private string _connectionString;

        public DbSet<Device> Devices { get; set; }
        public DbSet<Host> Hosts { get; set; }
        public DbSet<Process> Processes { get; set; }
        public DbSet<HostDevice> HostDevices { get; set; }
        public DbSet<ProcessHostDevice> ProcessHostDevices { get; set; }
        public DbSet<Record> Records { get; set; }
        public DbSet<Profile> Profiles { get; set; }

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
            optionsBuilder.UseSqlServer(_connectionString);
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
