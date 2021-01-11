using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Services
{
    public class ProcessService : ServiceBase<Process>, IProcessService
    {
        #region injected properties
        //protected IIstpContextFactory ContextFactory { get; set; }
        #endregion

        public ProcessService() { }

        public ProcessService(IEdmContext db) : base(db) { }

        public override async Task<Process> Delete(int id)
        {
            var process = await Get(id);
            var used = await Db.Operations.AnyAsync(o => o.ProcessId == id);
            return await Delete(process, used);
        }
    }
}
