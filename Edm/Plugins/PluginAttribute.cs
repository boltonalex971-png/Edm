using System;
using System.Collections.Generic;
using System.Text;

namespace Microprojects.Edm.Plugins
{
    [AttributeUsage(AttributeTargets.Class)]
    public class PluginAttribute : Attribute
    {
        public string SpaPath { get; set; }
        public string UiRoot { get; set; }
        public string Guid { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }

        /// <summary>
        /// Optional i18next key for the localized plugin display name. When
        /// set, consuming SPAs resolve <c>t(NameKey, Name)</c> — falling back
        /// to <see cref="Name"/> if the catalog lacks the key. Convention:
        /// <c>"&lt;Plugin&gt;.name"</c> (e.g. <c>"Logistics.name"</c>);
        /// catalog lives in the SPA's <c>plugins</c> namespace.
        /// </summary>
        public string NameKey { get; set; }

        /// <summary>
        /// Optional i18next key for the localized plugin description. Same
        /// resolution rules as <see cref="NameKey"/>.
        /// </summary>
        public string DescriptionKey { get; set; }
    }
}
