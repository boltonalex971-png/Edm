using Optosense.Edm.Core.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Services
{
    public class ServiceBase
    {
        #region Injected Properties
        protected IEdmContext Db { get; set; }
        //protected ICache Cache { get; set; }
        //protected ILogger Log { get; set; }
        #endregion

        public ServiceBase() { }

        public ServiceBase(IEdmContext db)
        {
            Db = db;
        }
    }
}
