import { registerNs } from '@logistics/i18n/registerNs'
import en from './repacking.locales/en.json'
import ru from './repacking.locales/ru.json'

// Registers the `repacking` namespace at module load. Importing this file
// anywhere in the repacking folder is enough — registerNs is idempotent.
registerNs('repacking', { en, ru })
