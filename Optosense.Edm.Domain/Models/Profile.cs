using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    /// <summary>
    /// Profile describes a set of steps on timeline to achieve 
    /// apropriate results. Each device driver, defined by 
    /// <code>Model</code> property, is responsible for 
    /// the profile steps interpretaion.
    /// If <code>IsActive</code> property is false it could mean 
    /// that the profile was customized just for certain operation(s) 
    /// and can not be applied anywhere else
    /// </summary>
    public class Profile : TypeObject
    {
        public int ProcessId { get; set; }

        /// <summary>
        /// The device type to which the profile is targeted
        /// </summary>
        public DeviceType Type { get; set; }

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
    }
}
