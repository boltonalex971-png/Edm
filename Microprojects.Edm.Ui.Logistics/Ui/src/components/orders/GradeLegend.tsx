import type { Grade, UUID } from '@logistics/data/types'
import { colorForGradeId } from '@logistics/utils/gradePalette'

type GradeLegendProps = {
    grades: Grade[]
    /** Click handler: receives the grade id, or `null` for the "No grade" chip. */
    onPick?: (gradeId: UUID | null) => void
}

const CHIP_STYLE = (interactive: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    cursor: interactive ? 'pointer' : 'default',
    padding: '2px 6px',
    borderRadius: 4,
})

export function GradeLegend({ grades, onPick }: GradeLegendProps) {
    if (!grades || grades.length === 0) return null
    const interactive = !!onPick
    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: '#555',
                margin: '0.25rem 0 0.5rem',
            }}
        >
            <span style={{ fontWeight: 600, marginRight: 4 }}>Grades:</span>
            {grades.map((g) => (
                <span
                    key={g.id}
                    style={CHIP_STYLE(interactive)}
                    onClick={onPick ? () => onPick(g.id) : undefined}
                    title={interactive ? 'Select items with this grade' : undefined}
                >
                    <span
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: 3,
                            background: colorForGradeId(g.id) ?? '#eee',
                            border: '1px solid rgba(0,0,0,0.15)',
                        }}
                    />
                    {g.name}
                </span>
            ))}
            <span
                style={{ ...CHIP_STYLE(interactive), color: '#888' }}
                onClick={onPick ? () => onPick(null) : undefined}
                title={interactive ? 'Select items without a grade' : undefined}
            >
                <span
                    style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: '#e3f2fd',
                        border: '1px solid #90caf9',
                    }}
                />
                No grade
            </span>
        </div>
    )
}
