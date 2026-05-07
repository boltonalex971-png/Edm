using Microprojects.Edm.Domain;
using System;
using System.Collections.Generic;

using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public enum ExecutionStatus
    {
        Succeed = 0,
        InvalidResponse = 1,
        Failed = 2,
        Timeout = 3,
        NotCompleted = 4
    }

    public class Record : DomainObject
    {
        public int OperationHostDeviceId { get; set; }

        public DateTime ScheduledAt { get; set; }
        public DateTime ExecutedAt { get; set; }
        public Dictionary<string, object> Parameters { get; set; }
        public string /*byte[]*/ Request { get; set; }
        public string /*byte[]*/ Response { get; set; }
        public string Info { get; set; }
        public ExecutionStatus Status { get; set; }
        public bool IsValid { get; set; }
        public string Message { get; set; }
        
        public OperationHostDevice Device { get; set; }
        public ICollection<RecordOperationCriterion> Criteria { get; set; }
    }
}
