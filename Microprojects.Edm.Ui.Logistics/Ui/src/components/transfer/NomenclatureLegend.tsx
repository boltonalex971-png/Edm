import type { LegendEntry } from '@logistics/components/transfer/visibleFromItems'
import type { UUID } from '@logistics/data/types'

type NomenclatureLegendProps = {
    nomenclatures: LegendEntry[]
    /** Click handler: receives the nomenclature id. */
    onPick?: (nomenclatureId: UUID) => void
}

const CHIP_STYLE = (interactive: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    cursor: interactive ? 'pointer' : 'default',
    padding: '2px 6px',
    borderRadius: 4,
    border: '1px solid var(--line)',
    background: 'var(--surface-2)',
})

/** Chip row of nomenclatures present in the visible items. Hides itself
 *  when there's nothing useful to choose between (≤1 entry). */
export function NomenclatureLegend({
    nomenclatures,
    onPick,
}: NomenclatureLegendProps) {
    if (!nomenclatures || nomenclatures.length <= 1) return null
    const interactive = !!onPick
    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: 'var(--ink-2)',
            }}
        >
            <span style={{ fontWeight: 600, marginRight: 4 }}>
                Nomenclatures:
            </span>
            {nomenclatures.map((n) => (
                <span
                    key={n.id}
                    style={CHIP_STYLE(interactive)}
                    onClick={onPick ? () => onPick(n.id) : undefined}
                    title={
                        interactive
                            ? 'Select items with this nomenclature'
                            : undefined
                    }
                >
                    {n.name || '(unnamed)'}
                </span>
            ))}
        </div>
    )
}
