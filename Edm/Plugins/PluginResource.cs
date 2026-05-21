using System.Globalization;
using System.IO;
using System.Reflection;

namespace Microprojects.Edm.Plugins
{
    /// <summary>
    /// Locale-aware lookup for embedded plugin resources (ABOUT.md, CHANGES.md).
    /// Files are embedded as <c>{AssemblyName}.ABOUT.md</c> and a per-locale
    /// variant lives at <c>{AssemblyName}.ABOUT.{lng}.md</c>. The lookup probes:
    ///   1. The full UI culture (e.g. <c>ABOUT.ru-RU.md</c>)
    ///   2. The neutral parent culture (e.g. <c>ABOUT.ru.md</c>)
    ///   3. The language-neutral fallback (<c>ABOUT.md</c>)
    /// </summary>
    public static class PluginResource
    {
        /// <summary>
        /// Reads an embedded markdown resource for the active <see cref="CultureInfo.CurrentUICulture"/>.
        /// </summary>
        /// <param name="assembly">The owning plugin assembly.</param>
        /// <param name="baseName">Resource base name without extension (e.g. <c>"ABOUT"</c>).</param>
        /// <returns>The resource content, or <c>null</c> if no matching resource exists.</returns>
        public static string ReadLocalized(Assembly assembly, string baseName)
        {
            var asmName = assembly.GetName().Name;
            var culture = CultureInfo.CurrentUICulture;

            // Walk the culture chain (e.g. ru-RU → ru → invariant). InvariantCulture
            // has an empty Name; that's the language-neutral file (e.g. ABOUT.md).
            for (var c = culture; c != null && c != c.Parent; c = c.Parent)
            {
                var name = string.IsNullOrEmpty(c.Name)
                    ? $"{asmName}.{baseName}.md"
                    : $"{asmName}.{baseName}.{c.Name}.md";
                var content = TryReadResource(assembly, name);
                if (content != null) return content;
            }

            return TryReadResource(assembly, $"{asmName}.{baseName}.md");
        }

        private static string TryReadResource(Assembly assembly, string name)
        {
            using var stream = assembly.GetManifestResourceStream(name);
            if (stream == null) return null;
            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
    }
}
