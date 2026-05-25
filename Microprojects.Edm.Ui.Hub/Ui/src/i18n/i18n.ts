import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { registerEdmComponentsLocales } from '@microprojects/edm-components/i18n'

import commonEn  from './common.locales/en.json'
import commonRu  from './common.locales/ru.json'
import errorsEn  from './errors.locales/en.json'
import errorsRu  from './errors.locales/ru.json'
import hubEn     from './hub.locales/en.json'
import hubRu     from './hub.locales/ru.json'
import pluginsEn from './plugins.locales/en.json'
import pluginsRu from './plugins.locales/ru.json'

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { common: commonEn, hub: hubEn, plugins: pluginsEn, errors: errorsEn },
            ru: { common: commonRu, hub: hubRu, plugins: pluginsRu, errors: errorsRu },
        },
        // Multilang UI temporarily disabled; locked to English.
        // Re-enable: drop `lng: 'en'` and restore supportedLngs to ['en', 'ru'].
        lng: 'en',
        supportedLngs: ['en'],
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

// Pull in edm-components' own translations under the edm-* prefix.
registerEdmComponentsLocales(i18n)

export default i18n
