import 'i18next'

import common  from './common.locales/en.json'
import errors  from './errors.locales/en.json'
import hub     from './hub.locales/en.json'
import plugins from './plugins.locales/en.json'

// edm-components namespaces are typed as open-shape — their source dicts live
// in another package's src/ and aren't re-exported. Hub still gets autocomplete
// for its own namespaces; edm-* keys validate at runtime via English fallbacks.
type EdmNamespace = { readonly [key: string]: unknown }

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'common'
        returnNull: false
        resources: {
            common:          common
            hub:             hub
            plugins:         plugins
            errors:          errors
            'edm-auth':      EdmNamespace
            'edm-chrome':    EdmNamespace
            'edm-forms':     EdmNamespace
            'edm-master':    EdmNamespace
            'edm-page':      EdmNamespace
            'edm-realtime':  EdmNamespace
            'edm-relations': EdmNamespace
            'edm-states':    EdmNamespace
        }
    }
}
