import 'i18next'

import common      from './common.locales/en.json'
import consoleNs   from './console.locales/en.json'
import errors      from './errors.locales/en.json'

type EdmNamespace = { readonly [key: string]: unknown }

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'common'
        returnNull: false
        resources: {
            common:          common
            console:         consoleNs
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
