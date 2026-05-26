using System.Collections.Generic;
using System.Transactions;
using Microprojects.Edm.Models;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models;

public class OperationInfo : OperationStatus
{
    public string Number { get; set; }
    public ProcessInfo Process { get; set; }
    public IEnumerable<OperationHostDevice> Devices { get; set; }
    public IEnumerable<Record> Records { get; set; }
    public IEnumerable<OperationCriterionModel>  Criteria { get; set; }
}