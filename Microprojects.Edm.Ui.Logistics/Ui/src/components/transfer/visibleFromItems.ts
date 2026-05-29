import type { Item, UUID } from '@logistics/data/types'

/** Narrow shape consumed by the shared GradeLegend / TransferContextMenu —
 *  a Grade satisfies this structurally, but Item-derived chips that lack
 *  processId/isActive do too. */
export type LegendEntry = { id: UUID; name: string; color?: string }

/** Distinct grades present on the given items, in first-seen order.
 *  Items missing either gradeId or gradeName are skipped — the legend has
 *  nothing useful to show for them. */
export function visibleGrades(items: Item[]): LegendEntry[] {
    const map = new Map<UUID, LegendEntry>()
    for (const it of items) {
        if (it.gradeId && it.gradeName && !map.has(it.gradeId)) {
            map.set(it.gradeId, {
                id: it.gradeId,
                name: it.gradeName,
                color: it.gradeColor,
            })
        }
    }
    return [...map.values()]
}

/** Distinct nomenclatures present on the given items, in first-seen order. */
export function visibleNomenclatures(items: Item[]): LegendEntry[] {
    const map = new Map<UUID, string>()
    for (const it of items) {
        if (it.nomenclatureId && !map.has(it.nomenclatureId)) {
            map.set(it.nomenclatureId, it.nomenclatureName ?? '')
        }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }))
}

/** Distinct nomenclature + grade names across the given items. Used to
 *  build the compact selection label (amount + nomenclatures + grades). */
export function selectionSummary(items: Item[]): {
    nomenclatureNames: string[]
    gradeNames: string[]
} {
    const noms = new Set<string>()
    const grades = new Set<string>()
    for (const it of items) {
        if (it.nomenclatureName) noms.add(it.nomenclatureName)
        if (it.gradeName) grades.add(it.gradeName)
    }
    return { nomenclatureNames: [...noms], gradeNames: [...grades] }
}
