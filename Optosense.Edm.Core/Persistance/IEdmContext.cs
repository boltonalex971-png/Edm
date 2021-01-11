using System;
using System.Diagnostics.CodeAnalysis;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Optosense.Edm.Domain.Models;

namespace Optosense.Edm.Core.Persistance
{
    public interface IEdmContext : IDisposable
    {
        DbSet<Device> Devices { get; set; }
        DbSet<Host> Hosts { get; set; }
        DbSet<HostDevice> HostDevices { get; set; }
        DbSet<Operation> Operations { get; set; }
        DbSet<OperationHostDevice> OperationHostDevices { get; set; }
        DbSet<Process> Processes { get; set; }
        DbSet<Profile> Profiles { get; set; }
        DbSet<Record> Records { get; set; }
        DbSet<Workplace> Workplaces { get; set; }
        DbSet<WorkplaceHostDevice> WorkplaceHostDevices { get; set; }
        DbSet<WorkplaceProcess> WorkplaceProcesses{ get; set; }

        int SaveChanges();
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        DbSet<TEntity> Set<TEntity>() where TEntity : class;
        EntityEntry<TEntity> Entry<TEntity>([NotNullAttribute] TEntity entity) where TEntity : class;
    }
}