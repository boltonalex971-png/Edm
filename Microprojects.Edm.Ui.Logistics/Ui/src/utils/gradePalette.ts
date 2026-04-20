import type { Grade, UUID } from '@logistics/data/types'

const PALETTE = [
    '#fca5a5',
    '#fdba74',
    '#fde68a',
    '#bef264',
    '#86efac',
    '#5eead4',
    '#7dd3fc',
    '#a5b4fc',
    '#d8b4fe',
    '#f9a8d4',
    '#fecaca',
    '#fed7aa',
]

function hashString(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) {
        h = (h << 5) - h + s.charCodeAt(i)
        h |= 0
    }
    return Math.abs(h)
}

/**
 * Deterministic color for a grade id — independent of the grades list so every
 * tare panel can colorize slots without fetching grades. Two grades with
 * different ids always get colors independently; the same id always gets the
 * same color.
 */
export function colorForGradeId(gradeId?: UUID | null): string | undefined {
    if (!gradeId) return undefined
    return PALETTE[hashString(gradeId) % PALETTE.length]
}

export type GradeColorLookup = (gradeId?: UUID | null) => string | undefined

export function buildGradePalette(
    _grades?: Grade[] | undefined,
): GradeColorLookup {
    return colorForGradeId
}
