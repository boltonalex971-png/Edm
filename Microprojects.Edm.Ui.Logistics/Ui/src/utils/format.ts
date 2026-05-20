/**
 * Quantity/number formatters used across logistics UI.
 *
 * Countable items are always whole numbers (rendered as integers), while
 * non-countable items may carry fractional amounts (grams, meters, etc.) and
 * must preserve the decimals the user entered. We keep up to 3 decimals and
 * trim trailing zeros so "5" stays "5" but "0.5" shows as "0.5".
 *
 * Date helpers read the active i18next locale at call time so they reflect
 * runtime language switches without each caller having to subscribe.
 */

import i18n from '../i18n/i18n'

const DECIMAL_PLACES = 3

export type DateLike = string | number | Date | null | undefined

// Backend stores all timestamps in UTC. Newtonsoft serializes
// DateTimeKind.Unspecified without a 'Z' suffix, which JS would otherwise
// parse as local time. Append 'Z' when no zone designator is present.
export function parseUtcDate(value: DateLike): Date | undefined {
    if (value == null || value === '') return undefined
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? undefined : value
    }
    if (typeof value === 'number') {
        const d = new Date(value)
        return Number.isNaN(d.getTime()) ? undefined : d
    }
    const s = value.trim()
    const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(s)
    const d = new Date(hasTz ? s : `${s}Z`)
    return Number.isNaN(d.getTime()) ? undefined : d
}

export function formatLocalDate(value: DateLike): string {
    const d = parseUtcDate(value)
    return d ? d.toLocaleDateString(i18n.language) : ''
}

export function formatLocalDateTime(value: DateLike): string {
    const d = parseUtcDate(value)
    return d ? d.toLocaleString(i18n.language) : ''
}

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
