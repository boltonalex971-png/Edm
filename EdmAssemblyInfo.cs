using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

[assembly: AssemblyCompany("Microprojects")]
[assembly: AssemblyProduct("Edm")]
[assembly: AssemblyCopyright("Copyright 2020-2025")]
[assembly: AssemblyTrademark("")]
[assembly: AssemblyCulture("")]

// AssemblyVersion: bump only on breaking changes to the public surface
// of these shared libraries. Plugins bind by FullName (incl. Version), so
// a bump forces a recompile of every plugin against the new contract --
// loud FileNotFoundException at load time beats silent MissingMethodException
// at runtime. AssemblyFileVersion carries the per-build counter and may
// bump every release; it does not affect binding.
[assembly: AssemblyVersion("2.0.0.0")]
[assembly: AssemblyFileVersion("2.0.0.0")]
