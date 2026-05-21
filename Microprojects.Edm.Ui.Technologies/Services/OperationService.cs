using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Infrastructure;
using Microprojects.Edm.Jobs;
using Microprojects.Edm.Models;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Services;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Technologies.Services
{
    public class OperationService : ServiceBase<TechnologiesContext, Operation>, IOperationService
    {
        private readonly IRemoteJobs _commands;

        public OperationService(TechnologiesContext db, IUserService userService, IRemoteJobs commands)
            : base(db, userService)
        {
            _commands = commands;
        }

        public async Task<Operation> Create(Operation operation)
        {
            ArgumentNullException.ThrowIfNull(operation);

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
                        ProfileId = c.ProfileId,
                    })
                    .ToList();
                operation.WorkplaceProcessId = wb.WorkplaceProcessId;
            }

            operation.Created = DateTime.UtcNow;
            return await Save(operation);
        }

        public async Task<Operation> Copy(Guid operationId)
        {
            var origin = await Db.Operations.AsNoTracking()
                             .Include(o => o.Devices)
                             .FirstOrDefaultAsync(o => o.Id == operationId)
                         ?? throw new EdmException(
                             "Technologies.Operation.NotFound",
                             new Dictionary<string, object> { ["operationId"] = operationId },
                             $"Operation with id {operationId} not found");
            var operation = (Operation)origin.Copy();
            operation.Created = DateTime.UtcNow;
            operation.Cancelled = null;
            operation.Completed = null;
            operation.Started = null;
            operation.Id = Guid.Empty;
            operation.Meta = null!;
            foreach (var device in operation.Devices)
            {
                device.Id = Guid.Empty;
            }

            return await Save(operation);
        }

        public async Task<IEnumerable<Record>> GetRecords(Guid operationId, Guid? lastRecordId)
        {
            var query = Db.Records.AsNoTracking()
                .Include(r => r.Device)
                .Where(r => r.Device.OperationId == operationId);
            if (lastRecordId.HasValue && lastRecordId.Value != Guid.Empty)
            {
                // Guids sort lexicographically; UUIDv8 monotonic-ish ordering means
                // this approximates "records newer than lastRecordId".
                query = query.Where(r => string.Compare(r.Id.ToString(), lastRecordId.Value.ToString()) > 0);
            }
            return await query.ToListAsync();
        }

        public async Task<IEnumerable<OperationCriterion>> GetCriterion(Guid operationId, Guid? lastId)
        {
            return await Db.OperationCriteria.AsNoTracking()
                .Include(c => c.AuditCriterion.Zone)
                .Where(c => c.OperationId == operationId)
                .ToListAsync();
        }

        public async Task<IEnumerable<OperationCriterion>> GetCriteria(Guid operationId)
        {
            return await Db.OperationCriteria.AsNoTracking()
                .Include(c => c.AuditCriterion.Zone)
                .Where(c => c.OperationId == operationId)
                .ToListAsync();
        }

        public async Task<Operation> Start(Guid operationId, DateTime startAt)
        {
            var operation = await Db.Operations.FirstOrDefaultAsync(o => o.Id == operationId) ??
                            throw new EdmException(
                                "Technologies.Operation.NotFound",
                                new Dictionary<string, object> { ["operationId"] = operationId },
                                "Operation not found");
            var result = await _commands.StartOperation(operationId, startAt);
            if (result.Status != JobStatus.SUCCESS)
            {
                throw new EdmException(
                    "Technologies.Operation.StartFailed",
                    new Dictionary<string, object> { ["message"] = result.Message },
                    $"Cannot start operation: {result.Message}");
            }

            operation.Started = startAt;
            await Db.SaveChangesAsync();
            return operation;
        }

        public async Task<Operation> Stop(Guid operationId)
        {
            var status = await Status(operationId);
            if (status.State != OperationState.InProgress && status.State != OperationState.Faulted)
            {
                throw new EdmException(
                    "Technologies.Operation.NotRunning",
                    new Dictionary<string, object> { ["operationId"] = operationId },
                    $"Operation with id {operationId} is not running");
            }

            if (status.State == OperationState.InProgress)
            {
                await _commands.CancelOperation(operationId);
            }
            else
            {
                await StopOperation(operationId);
            }

            return await Db.Operations.FindAsync(operationId);
        }

        public async Task<OperationStatus> Status(Guid operationId)
        {
            var operation = await Db.Operations.FirstOrDefaultAsync(o => o.Id == operationId)
                            ?? throw new EdmException(
                                "Technologies.Operation.NotFound",
                                new Dictionary<string, object> { ["operationId"] = operationId },
                                $"Operation with id {operationId} is not found");

            return await GetStatus(operation);
        }

        public async Task<OperationStatus> GetStatus(Operation operation)
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

        public async Task<IEnumerable<OperationHostDevice>> GetOperationDevices(Guid id)
        {
            return await Db.OperationHostDevices.AsNoTracking()
                .Include(d => d.HostDevice.Device)
                .Include(d => d.HostDevice.Host)
                .Include(d => d.Profile)
                .Where(d => d.OperationId == id)
                .ToListAsync();
        }

        public async Task<Operation> StopOperation(Guid operationId)
        {
            var result = await Get(operationId);
            result.Cancelled = DateTime.UtcNow;
            await Db.SaveChangesAsync();
            Db.Entry(result).State = EntityState.Detached;
            return result;
        }

        public async Task<Operation> CompleteOperation(Guid operationId)
        {
            var result = await Get(operationId) ??
                throw new EdmException(
                    "Technologies.Operation.NotFound",
                    new Dictionary<string, object> { ["operationId"] = operationId },
                    "Operation not found");
            if (result.Cancelled != null || result.Completed != null)
                throw new EdmException(
                    "Technologies.Operation.AlreadyFinished",
                    "Operation has been finished already.");
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
                            throw new EdmException(
                                "Technologies.Workbench.NotFound",
                                "Workbench for the specified process cannot be found.");
            var operation = await Create(new Operation { WorkbenchId = workbench.Id, Meta = null! });

            return (operation, workbench.WorkplaceProcess.Process);
        }

        public async Task<(bool, string)> GetResult(Guid operationId)
        {
            var invalid = await Db.OperationCriteria.AsNoTracking()
                .FirstOrDefaultAsync(c => c.OperationId == operationId && !c.Valid);
            return (invalid?.Valid ?? true, invalid?.Message);
        }
    }
}
