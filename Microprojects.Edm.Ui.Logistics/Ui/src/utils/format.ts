/**
 * Quantity/number formatters used across logistics UI.
 *
 * Countable items are always whole numbers (rendered as integers), while
 * non-countable items may carry fractional amounts (grams, meters, etc.) and
 * must preserve the decimals the user entered. We keep up to 3 decimals and
 * trim trailing zeros so "5" stays "5" but "0.5" shows as "0.5".
 */

const DECIMAL_PLACES = 3

export function formatQuantity(
    value: number | undefined | null,
    countable?: boolean,
): string {
    if (value == null || Number.isNaN(value)) {
        return '—'
    }
    if (countable) {
        return String(Math.round(value))
    }
    // Drop epsilon noise and trailing zeros.
    const rounded = Number(value.toFixed(DECIMAL_PLACES))
    return Number.isInteger(rounded) ? rounded.toFixed(0) : String(rounded)
}

export function formatUnits(
    value: number | undefined | null,
    units?: string,
    countable?: boolean,
): string {
    const qty = formatQuantity(value, countable)
    const u = units?.trim() || 'pcs'
    return `${qty} ${u}`
}
