using System;
using System.Collections.Generic;

namespace Microprojects.Edm
{
    public class EdmException : Exception
    {
        /// <summary>
        /// Stable machine key for client-side translation. Format
        /// `Plugin.Category.Specific` (e.g. `Logistics.Tare.NotFound`).
        /// Null when the throw site hasn't been migrated to the catalog.
        /// </summary>
        public string Code { get; }

        /// <summary>
        /// Interpolation values for the localized template on the client.
        /// Keys match `{{placeholder}}` names in the i18next key body.
        /// </summary>
        public IReadOnlyDictionary<string, object> Params { get; }

        public EdmException()
        {
            Code = null;
            Params = null;
        }

        public EdmException(string message) : base(message)
        {
            Code = null;
            Params = null;
        }

        public EdmException(string message, Exception innerException) : base(message, innerException)
        {
            Code = null;
            Params = null;
        }

        /// <summary>
        /// Code-bearing constructor (no params). The fallback message is the
        /// English rendering the server uses when the client lacks the catalog key.
        /// </summary>
        public EdmException(string code, string fallbackMessage) : base(fallbackMessage)
        {
            Code = code;
            Params = null;
        }

        /// <summary>
        /// Code-bearing constructor with interpolation params keyed by
        /// `{{placeholder}}` names in the client-side catalog template.
        /// </summary>
        public EdmException(string code, IReadOnlyDictionary<string, object> @params, string fallbackMessage)
            : base(fallbackMessage)
        {
            Code = code;
            Params = @params;
        }

        public EdmException(string code, IReadOnlyDictionary<string, object> @params, string fallbackMessage, Exception innerException)
            : base(fallbackMessage, innerException)
        {
            Code = code;
            Params = @params;
        }
    }
}
