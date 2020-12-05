using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Optosense.Edm.Attributes
{
    [AttributeUsage(AttributeTargets.Class)]
    public class PluginAttribute : Attribute
    {
        public string UiPath { get; set; }
        public string UiRoot { get; set; }
    }
}
