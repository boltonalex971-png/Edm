using Microprojects.Edm.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public class Setting : LegacyIntDomainObject
    {
        public Guid Guid { get; set; }
        public string Name { get; set; }
        public string Value { get; set; }
    }
}
