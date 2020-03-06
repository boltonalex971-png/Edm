using System;
using System.Collections.Generic;
using System.Reflection;
using System.Runtime.Loader;
using System.Text;

namespace Microprojects.Edm
{
    public class EdmLoadContext : AssemblyLoadContext
    {
        public EdmLoadContext()
        {
        }

        protected override Assembly Load(AssemblyName assemblyName)
        {
            return Assembly.Load(assemblyName);
        }
    }
}
