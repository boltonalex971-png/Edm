import 'i18next'

// Plugin-side namespaces (one per feature folder + 2 shared).
import common              from './common.locales/en.json'
import widgets             from './widgets.locales/en.json'
import errors              from './errors.locales/en.json'
import config              from '../components/config/config.locales/en.json'
import configNomenclature  from '../components/config/nomenclature/nomenclature.locales/en.json'
import configProcess       from '../components/config/process/process.locales/en.json'
import configTaretype      from '../components/config/taretype/taretype.locales/en.json'
import desktop             from '../components/desktop/desktop.locales/en.json'
import homepages           from '../components/homepages/homepages.locales/en.json'
import items               from '../components/items/items.locales/en.json'
import orders              from '../components/orders/orders.locales/en.json'
import repacking           from '../components/repacking/repacking.locales/en.json'
import supplies            from '../components/supplies/supplies.locales/en.json'
import tare                from '../components/tare/tare.locales/en.json'
import transfer            from '../components/transfer/transfer.locales/en.json'

// edm-components namespaces are typed as open-shape (`{ [k: string]: any }`)
// because the source dicts live in another package's src/ and aren't re-exported.
// You still get autocomplete for the Logistics namespaces; edm-* keys are
// validated at runtime by the English fallback in the package's own t() calls.
type EdmNamespace = { readonly [key: string]: unknown }

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'common'
        // Disable resolving missing keys to `null` (matches our init `returnNull: false`).
        returnNull: false
        resources: {
            common:                common
            widgets:               widgets
            errors:                errors
            config:                config
            'config/nomenclature': configNomenclature
            'config/process':      configProcess
            'config/taretype':     configTaretype
            desktop:               desktop
            homepages:             homepages
            items:                 items
            orders:                orders
            repacking:             repacking
            supplies:              supplies
            tare:                  tare
            transfer:              transfer
            'edm-auth':            EdmNamespace
            'edm-chrome':          EdmNamespace
            'edm-forms':           EdmNamespace
            'edm-master':          EdmNamespace
            'edm-page':            EdmNamespace
            'edm-realtime':        EdmNamespace
            'edm-relations':       EdmNamespace
            'edm-states':          EdmNamespace
        }
    }
}
