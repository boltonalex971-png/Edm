using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.ViewModels;

namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface IProcessService : IGenericService<Process>
{
    Task<SubProcess> AddSubProcess(Guid id, SubProcess process);
    Task<bool> DeleteSubProcess(Guid id, Guid subProcessId);
    Task<SubProcess> SaveSubProcess(SubProcess sp);
    Task<IEnumerable<SubProcess>> GetSubProcesses(Guid id);
    Task<Specification?> GetActiveSpecification(Guid processId);
    Task<SpecificationNomenclature> AddSpecificationRow(Guid processId, SpecificationNomenclature row);
    Task<bool> DeleteSpecificationRow(Guid processId, Guid rowId);
    Task<SpecificationNomenclature> SaveSpecificationRow(Guid processId, SpecificationNomenclature row);

    Task<IEnumerable<Grade>> GetGrades(Guid processId);
    Task<Grade> AddGrade(Guid processId, Grade grade);
    Task<Grade> SaveGrade(Guid processId, Grade grade);
    Task<bool> DeleteGrade(Guid processId, Guid gradeId);
}