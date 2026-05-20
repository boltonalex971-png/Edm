import { registerNs } from '@logistics/i18n/registerNs'
import en from './taretype.locales/en.json'
import ru from './taretype.locales/ru.json'

// Registers the `config/taretype` namespace at module load. Importing this file
// anywhere in the folder is enough — registerNs is idempotent.
registerNs('config/taretype', { en, ru })
