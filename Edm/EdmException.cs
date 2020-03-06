using System;
using System.Collections.Generic;
using System.Text;

namespace Microprojects.Edm
{
    public class EdmException : Exception
    {
        public EdmException() 
        { 
        }
        
        public EdmException(string message) : base(message)
        {
        }

        public EdmException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}
