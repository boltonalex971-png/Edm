using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface IProcessService : IGenericService<Process>
{
    Task<SubProcess> AddSubProcess(Guid id, SubProcess process);
    Task<bool> DeleteSubProcess(Guid id, Guid subProcessId);
    Task<SubProcess> SaveSubProcess(SubProcess sp);
    Task<IEnumerable<SubProcess>> GetSubProcesses(Guid id);
}