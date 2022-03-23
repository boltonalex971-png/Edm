using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Models
{
    public enum OperationState
    {
        New,
        Scheduled,
        InProgress,
        Completed,
        Cancelled,
        Abandoned
    }

    public class OperationStatus
    {
        public int Id { get; set; }
        public OperationState State { get; set; }
        /// <summary>
        /// Operation progress in percents
        /// </summary>
        public double Progress { get; set; }
        /// <summary>
        /// Estimated operation duration in minutes, usually equals to longest profile
        /// </summary>
        public int Estimated { get; set; }
        /// <summary>
        /// Operation time elapsed in minutes
        /// </summary>
        public int Elapsed { get; set; }
        public string Message { get; set; }
    }
}
