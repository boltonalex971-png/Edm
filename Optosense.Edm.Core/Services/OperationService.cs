using Microprojects.Edm;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Newtonsoft.Json;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Infrastructure;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Services
{
    public class OperationService : ServiceBase<Operation>, IOperationService
    {
        private IRemoteJobs _commands;

        public OperationService()
        {
        }

        public OperationService(EdmContext db, IRemoteJobs commands) : base(db)
        {
            _commands = commands;
        }

        public async Task<Operation> Create(Operation operation)
        {
            if (operation == null)
            {
                throw new ArgumentNullException(nameof(operation));
            }

            if (operation.WorkbenchId != null)
            {
                var wb = await Db.Workbenches
                             .Include(wb => wb.DeviceConfigurations.Select(dc => dc.WorkplaceHostDevice))
                             .Include(wb => wb.WorkplaceProcess)
                             .FirstOrDefaultAsync(wb => wb.Id == operation.WorkbenchId)
                         ?? throw new ArgumentException("No workbench found");
                var devices = wb.DeviceConfigurations;
                operation.Devices = devices
                    .Select(c => new OperationHostDevice
                    {
                        HostDeviceId = c.WorkplaceHostDevice.HostDeviceId,
                        Options = c.Configuration,
                        ProfileId = c.ProfileId
                    })
                    .ToList();
                operation.WorkplaceProcessId = wb.WorkplaceProcessId;
            }

            operation.Created = DateTime.UtcNow;
            var result = Db.Operations.Add(operation);
            await Db.SaveChangesAsync();
            return result.Entity;
        }

        public async Task<Operation> Copy(int operationId)
        {
            var origin = await Db.Operations.AsNoTracking()
                             .Include(o => o.Devices)
                             .FirstOrDefaultAsync(o => o.Id == operationId)
                         ?? throw new EdmException($"Operation with id {operationId} not found");
            var operation = (Operation)origin.Copy();
            operation.Created = DateTime.UtcNow;
            operation.Cancelled = null;
            operation.Completed = null;
            operation.Started = null;
            operation.Id = 0;
            foreach (var device in operation.Devices)
            {
                device.Id = 0;
            }
            
            var result = Db.Operations.Add(operation);
            await Db.SaveChangesAsync();
            return result.Entity;
        }

        //public async Task<IEnumerable<Operation>> Get<T>(
        //    Expression<Func<Operation, bool>> predicate, 
        //    Expression<Func<Operation, T>> include)
        //{
        //    var request = Db.Operations.Include(include);
        //    var whereReq = request.Where(predicate);
        //    var result = await whereReq.ToListAsync();
        //    return result;
        //}

        public async Task<IEnumerable<Record>> GetRecords(int operationId, int lastRecordId)
        {
            var recs = await Db.Records.AsNoTracking()
                .Include(r => r.Device)
                //.Include(r => r.Criteria).ThenInclude(c => c.OperationCriterion.AuditCriterion.Zone)
                .Where(r => r.Device.OperationId == operationId && r.Id > lastRecordId)
                .ToListAsync();
            return recs;
        }

        public async Task<IEnumerable<OperationCriterion>> GetCriterion(int operationId, int lastId)
        {
            var criterion = await Db.OperationCriteria.AsNoTracking()
                .Include(c => c.AuditCriterion.Zone)
                .Where(c => c.OperationId == operationId)
                .ToListAsync();
            return criterion;
        }

        public async Task<IEnumerable<OperationCriterion>> GetCriteria(int operationId)
        {
            var criteria = await Db.OperationCriteria.AsNoTracking()
                .Include(c => c.AuditCriterion.Zone)
                .Where(c => c.OperationId == operationId)
                .ToListAsync();
            return criteria;
        }

        public async Task<Operation> Start(int operationId, DateTime startAt)
        {
            var operation = await Db.Operations.FindAsync(operationId);
            await _commands.StartOperation(operationId, startAt);

            //var devices = await Db.OperationHostDevices
            //    .Include(d => d.Profile)
            //    .Include(d => d.HostDevice.Device)
            //    .Include(d => d.HostDevice.Host)
            //    .Include(d => d.Profile.Points)
            //    .Where(p => p.OperationId == operationId)
            //    .ToListAsync();

            //foreach (var operationHostDevice in devices)
            //{
            //    var driverOptions = JsonConvert.DeserializeObject<ExpandoObject>(operationHostDevice.HostDevice.Device.Parameters);
            //    JsonConvert.PopulateObject(operationHostDevice.HostDevice.Parameters, driverOptions);
            //    JsonConvert.PopulateObject(operationHostDevice.Options, driverOptions);
            //    var response = await _commands.StartDevice(
            //        operationHostDevice.Id,
            //        $"{operationHostDevice.HostDevice.Host.Url}:{operationHostDevice.HostDevice.Host.Port}",
            //        driverOptions,
            //        operationHostDevice.Profile.Points,
            //        operationHostDevice.HostDevice.Device.Model,
            //        startAt);
            //}

            operation.Started = startAt;
            await Db.SaveChangesAsync();
            return operation;
        }

        public async Task<Operation> Stop(int operationId)
        {
            //var operation = await Db.Operations.FindAsync(operationId)
            //    ?? throw new EdmException($"Operation with id {operationId} is not found");
            var status = await Status(operationId);
            if (status.State != OperationState.InProgress && status.State != OperationState.Faulted)
            {
                throw new EdmException($"Operation with id {operationId} is not running");
            }

            if (status.State == OperationState.InProgress)
            {
                await _commands.CancelOperation(operationId);
            }
            else
            {
                await StopOperation(operationId);
            }

            // Operation must be cancelled by command; get new status
            var operation = await Db.Operations.FindAsync(operationId);
            return operation;
        }

        public async Task<OperationStatus> Status(int operationId)
        {
            var operation = await Db.Operations.FirstOrDefaultAsync(o => o.Id == operationId)
                            ?? throw new EdmException($"Operation with id {operationId} is not found");

            return await GetStatus(operation);
        }

        protected async Task<OperationStatus> GetStatus(Operation operation)
        {
            var status = new OperationStatus
            {
                Id = operation.Id,
                State = operation switch
                {
                    { Completed: not null } => OperationState.Completed,
                    { Cancelled: not null } => OperationState.Cancelled,
                    { Started: not null, Completed: null, Scheduled: null } => OperationState.InProgress,
                    { Scheduled: not null, Started: null, Completed: null } => OperationState.Scheduled,
                    _ => OperationState.Idle
                }
            };
            if (status.State == OperationState.InProgress)
            {
                // Check if operation is really performing
                try
                {
                    status.State = await _commands.CheckOperationRun(operation.Id)
                        ? status.State
                        : OperationState.Faulted;
                }
                catch (Exception ex)
                {
                    status.State = OperationState.Faulted;
                    status.Error = ex.Message;
                }
            }

            status.StateTimestamp = status.State switch
            {
                OperationState.Completed => operation.Completed.Value,
                OperationState.Cancelled => operation.Cancelled.Value,
                OperationState.InProgress => operation.Started.Value,
                OperationState.Scheduled => operation.Scheduled.Value,
                OperationState.Idle => operation.Created,
                _ => DateTime.UtcNow
            };

            var (valid, message) = await GetResult(operation.Id);
            status.IsValid = valid && status.State != OperationState.Faulted &&
                             status.State != OperationState.Cancelled;
            status.Message = message;

            return status;
        }

        public async Task<IEnumerable<OperationHostDevice>> GetOperationDevices(int id)
        {
            var devices = await Db.OperationHostDevices.AsNoTracking()
                .Include(d => d.HostDevice.Device)
                .Include(d => d.HostDevice.Host)
                .Include(d => d.Profile)
                .Where(d => d.OperationId == id)
                .ToListAsync();
            return devices;
        }

        public async Task<Operation> StopOperation(int operationId)
        {
            var result = await Get(operationId);
            result.Cancelled = DateTime.UtcNow;
            await Db.SaveChangesAsync();
            Db.Entry(result).State = EntityState.Detached;
            return result;
        }

        public async Task<Operation> CompleteOperation(int operationId)
        {
            var result = await Get(operationId);
            result.Completed = DateTime.UtcNow;
            await Db.SaveChangesAsync();
            Db.Entry(result).State = EntityState.Detached;
            return result;
        }

        public async Task<(Operation, Process)> Launch(string processUid, string workbenchUid)
        {
            var workbench = await Db.Workbenches.AsNoTracking()
                                .Include(w => w.WorkplaceProcess.Process)
                                .FirstOrDefaultAsync(w =>
                                    w.CommonUid == workbenchUid &&
                                    w.WorkplaceProcess.Process.CommonUid == processUid) ??
                            throw new EdmException("Workbench for the specified process cannot be found");
            var operation = await Create(new Operation() { WorkbenchId = workbench.Id });

            return (operation, workbench.WorkplaceProcess.Process);
        }

        public async Task<(bool, string)> GetResult(int operationId)
        {
            var invalid = await Db.OperationCriteria.AsNoTracking()
                .FirstOrDefaultAsync(c => c.OperationId == operationId && !c.Valid);
            return (invalid?.Valid ?? true, invalid?.Message);
        }
    }
}