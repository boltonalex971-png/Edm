import { registerNs } from '@logistics/i18n/registerNs'
import en from './transfer.locales/en.json'
import ru from './transfer.locales/ru.json'

// Registers the `transfer` namespace at module load. Importing this file
// anywhere in the transfer folder is enough — registerNs is idempotent.
registerNs('transfer', { en, ru })
