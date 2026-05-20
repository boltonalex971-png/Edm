import { registerNs } from '@logistics/i18n/registerNs'
import en from './process.locales/en.json'
import ru from './process.locales/ru.json'

// Registers the `config/process` namespace at module load. Importing this file
// anywhere in the folder is enough — registerNs is idempotent.
registerNs('config/process', { en, ru })
