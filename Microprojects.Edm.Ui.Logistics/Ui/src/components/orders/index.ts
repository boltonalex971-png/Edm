import { registerNs } from '@logistics/i18n/registerNs'
import en from './orders.locales/en.json'
import ru from './orders.locales/ru.json'

// Registers the `orders` namespace at module load. Importing this file
// anywhere in the orders folder is enough — registerNs is idempotent.
registerNs('orders', { en, ru })
