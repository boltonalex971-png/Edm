using System;
using System.Collections.Generic;
using System.Reflection;
using System.Runtime.Loader;
using System.Text;

namespace Microprojects.Edm
{
    class DefaultLoadContext : AssemblyLoadContext
    {
        public DefaultLoadContext()
        {
        }

        protected override Assembly Load(AssemblyName assemblyName)
        {
            return Assembly.Load(assemblyName);
        }
    }
}
