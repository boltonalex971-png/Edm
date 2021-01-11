using Microprojects.Edm;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Newtonsoft.Json;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Infrastructure;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Services
{
    public class OperationService : ServiceBase<Operation>, IOperationService
    {
        private IRemoteCommands _commands;
        public OperationService()
        {
        }

        public OperationService(IEdmContext db, IRemoteCommands commands): base(db)
        {
            _commands = commands;
        }

        public async Task<Operation> Create(Operation operation)
        {
            var result = Db.Operations.Add(operation);
            await Db.SaveChangesAsync();
            return result.Entity;
        }

        public async Task<IEnumerable<Operation>> Get<T>(
            Expression<Func<Operation, bool>> predicate, 
            Expression<Func<Operation, T>> include)
        {
            var request = Db.Operations.Include(include);
            var whereReq = request.Where(predicate);
            var result = await whereReq.ToListAsync();
            return result;
        }

        public async Task<IEnumerable<Record>> GetRecords(int operationId, int lastRecordId)
        {
            var recs = await Db.Records
                .Include(r => r.Device)
                .Where(r => r.Device.OperationId == operationId && r.Id > lastRecordId)
                .ToListAsync();
            return recs;
        }

        public async Task<Operation> Start(int operationId, DateTime startAt)
        {
            var operation = await Db.Operations.FindAsync(operationId);
            await _commands.StartTestOperation(operationId, startAt);

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
            var operation = await Db.Operations.FindAsync(operationId)
                ?? throw new EdmException($"Operation with id {operationId} is not found");
            if (operation.Completed != null || operation.Started == null)
            {
                throw new EdmException($"Operation with id {operationId} is not running");
            }

            var result = await _commands.CancelOperation(operationId);
            // Operation must be cancelled by command; get new status
            operation = await Db.Operations.FindAsync(operationId);
            return operation;
        }

        public async Task<string> GetTasks()
        {
            return await _commands.StartOperation(1, DateTime.Now);
        }
    }
}
