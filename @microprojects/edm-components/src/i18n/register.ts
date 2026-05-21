import type { i18n as I18n } from 'i18next'

import authEn from '../components/auth/auth.en'
import authRu from '../components/auth/auth.ru'

import chromeEn from '../components/chrome/chrome.en'
import chromeRu from '../components/chrome/chrome.ru'

import formsEn from '../components/forms/forms.en'
import formsRu from '../components/forms/forms.ru'

import masterEn from '../components/master/master.en'
import masterRu from '../components/master/master.ru'

import pageEn from '../components/page/page.en'
import pageRu from '../components/page/page.ru'

import realtimeEn from '../components/realtime/realtime.en'
import realtimeRu from '../components/realtime/realtime.ru'

import relationsEn from '../components/relations/relations.en'
import relationsRu from '../components/relations/relations.ru'

import statesEn from '../components/states/states.en'
import statesRu from '../components/states/states.ru'

const BUNDLES: ReadonlyArray<readonly [string, string, Record<string, unknown>]> = [
    ['edm-auth',      'en', authEn],
    ['edm-auth',      'ru', authRu],

    ['edm-chrome',    'en', chromeEn],
    ['edm-chrome',    'ru', chromeRu],

    ['edm-forms',     'en', formsEn],
    ['edm-forms',     'ru', formsRu],

    ['edm-master',    'en', masterEn],
    ['edm-master',    'ru', masterRu],

    ['edm-page',      'en', pageEn],
    ['edm-page',      'ru', pageRu],

    ['edm-realtime',  'en', realtimeEn],
    ['edm-realtime',  'ru', realtimeRu],

    ['edm-relations', 'en', relationsEn],
    ['edm-relations', 'ru', relationsRu],

    ['edm-states',    'en', statesEn],
    ['edm-states',    'ru', statesRu],
]

/**
 * Register all bundled translations into the consumer's i18next instance.
 * Call once at app boot, after i18next.init() has resolved.
 *
 * Idempotent — re-registering the same (lng, ns) pair is a no-op.
 *
 * Components inside the package use `useTranslation('edm-<group>')` and
 * pass an English fallback as the second `t()` arg, so if a consumer
 * skips this call the components still render English.
 */
export function registerEdmComponentsLocales(i18n: I18n): void {
    for (const [ns, lng, dict] of BUNDLES) {
        if (i18n.hasResourceBundle(lng, ns)) continue
        i18n.addResourceBundle(lng, ns, dict, true, false)
    }
}
