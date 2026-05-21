using System;

namespace Microprojects.Edm.Models
{
    public enum OperationState
    {
        Idle,
        Scheduled,
        InProgress,
        Completed,
        Cancelled,
        Faulted
    }

    public class OperationStatus
    {
        public Guid Id { get; set; }
        public OperationState State { get; set; }
        /// <summary>
        /// Operation progress in percents
        /// </summary>
        public double Progress { get; set; }
        public bool IsValid { get; set; }
        /// <summary>
        /// Estimated operation duration in minutes, usually equals to the longest profile
        /// </summary>
        public int Estimated { get; set; }
        /// <summary>
        /// Operation time elapsed in minutes
        /// </summary>
        public int Elapsed { get; set; }
        public string Message { get; set; }
        public string Error { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public DateTime StateTimestamp { get; set; } = DateTime.UtcNow;
    }
}
