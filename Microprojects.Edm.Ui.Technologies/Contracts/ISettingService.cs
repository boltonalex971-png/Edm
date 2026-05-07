using Microprojects.Edm.Ui.Technologies.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Ui.Technologies.Contracts
{
    public interface ISettingService //: IGenericService<Setting>
    {
        Task<string> Get(Guid guid, string name);
        Task<T> Get<T>(Guid guid, string name);
        Task<string> Set(Guid guid, string name, string value);
        //Task<T> Set<T>(Guid guid, T value);
        //Task<T> Set<T>(Guid guid, string name, T value);
        //Task Delete(Guid guid, string name);
    }
}
