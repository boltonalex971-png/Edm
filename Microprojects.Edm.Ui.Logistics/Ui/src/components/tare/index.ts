import { registerNs } from '@logistics/i18n/registerNs'
import en from './tare.locales/en.json'
import ru from './tare.locales/ru.json'

// Registers the `tare` namespace at module load. Importing this file
// anywhere in the tare folder is enough — registerNs is idempotent.
registerNs('tare', { en, ru })
