import { registerNs } from '@logistics/i18n/registerNs'
import en from './homepages.locales/en.json'
import ru from './homepages.locales/ru.json'

// Registers the `homepages` namespace at module load. Importing this file
// anywhere in the homepages folder is enough — registerNs is idempotent.
registerNs('homepages', { en, ru })
