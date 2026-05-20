import { registerNs } from '@logistics/i18n/registerNs'
import en from './config.locales/en.json'
import ru from './config.locales/ru.json'

// Registers the `config` namespace at module load. Importing this file anywhere
// in the folder is enough — registerNs is idempotent.
registerNs('config', { en, ru })
