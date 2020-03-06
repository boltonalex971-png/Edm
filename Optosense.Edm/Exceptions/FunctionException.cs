using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm
{
    public class FunctionException : EdmException
    {
        public FunctionException(string message) : base(message) { }
        public FunctionException(string message, Exception e) : base(message, e) { }
    }
}
