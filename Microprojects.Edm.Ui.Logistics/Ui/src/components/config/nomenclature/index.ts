import { registerNs } from '@logistics/i18n/registerNs'
import en from './nomenclature.locales/en.json'
import ru from './nomenclature.locales/ru.json'

// Registers the `config/nomenclature` namespace at module load. Importing this
// file anywhere in the folder is enough — registerNs is idempotent.
registerNs('config/nomenclature', { en, ru })
