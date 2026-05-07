using System.Collections.Generic;
using System.Transactions;
using Optosense.Edm.Core.Models;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Main.Models;

public class OperationInfo : OperationStatus
{
    public ProcessInfo Process { get; set; }
    public IEnumerable<OperationHostDevice> Devices { get; set; }
    public IEnumerable<Record> Records { get; set; }
    public IEnumerable<OperationCriterionModel>  Criteria { get; set; }
}