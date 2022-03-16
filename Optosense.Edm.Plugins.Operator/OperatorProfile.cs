using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Profiles.Operator
{
    public enum OperatorAction
    {
        Get,
        Set
    }
    
    public class OperatorProfile : List<Step>
    {
    }

    public class Step
    {
        public int Order { get; set; }
        /// <summary>
        /// Define what kind of operator's action required. Can be a parameter request or instructions
        /// </summary>
        public OperatorAction Action { get; set; }
        /// <summary>
        /// If the action is a parameter request, specifies the list of required parameters in JSON array format
        /// </summary>
        public string Parameters { get; set; }
        /// <summary>
        /// Specifies the condition of triggering the step. Can involve profile input parameters and condition 
        /// operators as =, >, <; keywords for timing operations like "after" or "over" (>), "before" or "below" (<), "at" (=), 
        /// "each" (with offsets, e.g. "each 1 min") etc
        /// </summary>
        public string Condition { get; set; }
        public string Command { get; set; }
        public string Description { get; set; }
        public int ResponseTime { get; set; }
    }
}

