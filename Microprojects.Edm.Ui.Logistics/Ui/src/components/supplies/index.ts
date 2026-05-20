import { registerNs } from '@logistics/i18n/registerNs'
import en from './supplies.locales/en.json'
import ru from './supplies.locales/ru.json'

// Registers the `supplies` namespace at module load. Importing this file
// anywhere in the supplies folder is enough — registerNs is idempotent.
registerNs('supplies', { en, ru })
