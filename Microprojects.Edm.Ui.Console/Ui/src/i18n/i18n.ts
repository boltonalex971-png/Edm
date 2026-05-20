import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { registerEdmComponentsLocales } from '@microprojects/edm-components/i18n'

import commonEn  from './common.locales/en.json'
import commonRu  from './common.locales/ru.json'
import consoleEn from './console.locales/en.json'
import consoleRu from './console.locales/ru.json'

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { common: commonEn, console: consoleEn },
            ru: { common: commonRu, console: consoleRu },
        },
        supportedLngs: ['en', 'ru'],
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
