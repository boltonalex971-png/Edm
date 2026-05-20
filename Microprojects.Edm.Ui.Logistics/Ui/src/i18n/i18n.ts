import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { registerEdmComponentsLocales } from '@microprojects/edm-components/i18n'

// Seed bundles registered at app boot. Per-feature-folder bundles get added
// via registerNs() from each folder's index.ts as Phase 3 lands them.
import commonEn from './common.locales/en.json'
import commonRu from './common.locales/ru.json'
import commonEs from './common.locales/es-ES.json'
import widgetsEn from './widgets.locales/en.json'
import widgetsRu from './widgets.locales/ru.json'
import widgetsEs from './widgets.locales/es-ES.json'

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { common: commonEn, widgets: widgetsEn },
            ru: { common: commonRu, widgets: widgetsRu },
            'es-ES': { common: commonEs, widgets: widgetsEs },
        },
        supportedLngs: ['en', 'ru', 'es-ES'],
        fallbackLng: 'en',
        defaultNS: 'common',
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },
        returnNull: false,
    })

// Pull in edm-components' own translations under the edm:* prefix.
registerEdmComponentsLocales(i18n)

export default i18n
