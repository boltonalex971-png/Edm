using System;
using System.Collections.Generic;

namespace Optosense.Edm.Domain.Models
{
    public enum ExecutionStatus
    {
        Succeed = 0,
        Timeout = 1,
        Failed = 2
    }

    public class Record : DomainObject
    {
        public int OperationHostDeviceId { get; set; }

        public DateTime ScheduledAt { get; set; }
        public DateTime ExecutedAt { get; set; }
        public string Parameters { get; set; }
        public string /*byte[]*/ Request { get; set; }
        public string /*byte[]*/ Response { get; set; }
        public string Info { get; set; }
        public ExecutionStatus Status { get; set; }
        public bool IsValid { get; set; }
        public string Message { get; set; }

        public virtual OperationHostDevice Device { get; set; }
    }
}
