using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    /// <summary>
    /// Profile describes a set of steps on timeline to achieve appropriate
    /// results. Each device driver, defined by <code>Model</code> property,
    /// is responsible for the profile steps interpretation. Lifecycle (created,
    /// modified, deleted, completed) lives in Meta.
    /// </summary>
    public class Profile : DomainObject, IWithMeta
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public Guid ProcessId { get; set; }

        /// <summary>
        /// Reference to effective profiler plugin
        /// </summary>
        public Guid ProfilerGuid { get; set; }
        [NotMapped]
        public string ProfilerName { get; set; }

        /// <summary>
        /// Input parameters required by the profile to specify points or for any internal needs.
        /// Comma-separated list of parameter names.
        /// </summary>
        public string Input { get; set; }

        public IEnumerable<string> InParameterNames
        {
            get => Input?.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries) ??
                Enumerable.Empty<string>();
        }

        /// <summary>
        /// Output parameters required by devices implementing the profile.
        /// Comma-separated list of parameter names.
        /// </summary>
        public string Output { get; set; }

        public IEnumerable<string> OutParameterNames
        {
            get => Output?.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries) ??
                Enumerable.Empty<string>();
        }

        /// <summary>
        /// Profile can be described in Json format as alternative to set of steps
        /// </summary>
        public string TextJson { get; set; }

        public Process Process { get; set; }
        /// <summary>
        /// Profile can be described as a set of steps
        /// </summary>
        public ICollection<ProfilePoint> Points { get; set; }
        public ICollection<Audit> Audits { get; set; }

        public Meta Meta { get; set; } = null!;
    }
}
