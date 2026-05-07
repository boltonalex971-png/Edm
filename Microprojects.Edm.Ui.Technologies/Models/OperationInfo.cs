using System.Collections.Generic;
using System.Transactions;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Domain.Models;

namespace Microprojects.Edm.Ui.Main.Models;

public class OperationInfo : OperationStatus
{
    public ProcessInfo Process { get; set; }
    public IEnumerable<OperationHostDevice> Devices { get; set; }
    public IEnumerable<Record> Records { get; set; }
    public IEnumerable<OperationCriterionModel>  Criteria { get; set; }
}