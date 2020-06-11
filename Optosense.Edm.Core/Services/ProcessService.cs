using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Services
{
    public class ProcessService : ServiceBase, IProcessService
    {
        #region injected properties
        //protected IIstpContextFactory ContextFactory { get; set; }
        #endregion

        public ProcessService() { }

        public ProcessService(IEdmContext db) : base(db) { }

        public async Task<IEnumerable<Process>> GetAll()
        {
            var processes = await Db.Processes.AsNoTracking()
                .Where(p => p.IsActive)
                .ToListAsync();
            return processes;
        }

        public async Task<Process> Get(int id)
        {
            return await Db.Processes
                .FirstOrDefaultAsync(p => id == p.Id);
        }

        public async Task<Process> Save(Process process)
        {
            if (process.Id > 0)
            {
                var upd = await Db.Processes.SingleAsync(p => p.Id == process.Id);
                upd.Name = process.Name;
                upd.Description = process.Description;
                upd.DeviceTypes = process.DeviceTypes;
                upd.IsActive = true;
            }
            else
            {
                process.IsActive = true;
                Db.Processes.Add(process);
            }
            await Db.SaveChangesAsync();
            return process;
        }

        public async Task<Process> Delete(int id)
        {
            var process = await Get(id);
            var used = await Db.Operations.AnyAsync(o => o.ProcessId == id);
            if (used)
            {
                process.IsActive = false;
            }
            else
            {
                Db.Processes.Remove(process);
            }

            await Db.SaveChangesAsync();
            return process;
        }
    }
}
