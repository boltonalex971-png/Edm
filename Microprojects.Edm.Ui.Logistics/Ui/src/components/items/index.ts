import { registerNs } from '@logistics/i18n/registerNs'
import en from './items.locales/en.json'
import ru from './items.locales/ru.json'

// Registers the `items` namespace at module load. Importing this file
// anywhere in the items folder is enough — registerNs is idempotent.
registerNs('items', { en, ru })
