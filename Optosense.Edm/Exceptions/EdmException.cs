using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm
{
    public class EdmException : Exception
    {
        public EdmException(string message) : base(message) { }
        public EdmException(string message, Exception inner) : base(message, inner) { }
    }
}
