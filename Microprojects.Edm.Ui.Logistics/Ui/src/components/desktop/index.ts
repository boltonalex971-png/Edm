import { registerNs } from '@logistics/i18n/registerNs'
import en from './desktop.locales/en.json'
import ru from './desktop.locales/ru.json'

// Registers the `desktop` namespace at module load. Importing this file
// anywhere in the desktop folder is enough — registerNs is idempotent.
registerNs('desktop', { en, ru })
