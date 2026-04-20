import type { Grade, TareInfo, UUID } from '@logistics/data/types'
import { colorForGradeId } from '@logistics/utils/gradePalette'
import { useEffect } from 'react'

export type ContextTareOption = TareInfo & {
    occupied: number
    capacity: number
}

type AllocateContextMenuProps = {
    x: number
    y: number
    grades: Grade[]
    tares: ContextTareOption[]
    targetCount: number
    canAutofill: boolean
    onAutofillAll: () => void
    onFillTare: (tareId: UUID) => void
    onAssignGrade: (gradeId: UUID | undefined) => void
    onClose: () => void
}

const ROW_STYLE: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.4rem 0.75rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
}

const ROW_DISABLED_STYLE: React.CSSProperties = {
    ...ROW_STYLE,
    color: '#aaa',
    cursor: 'default',
}

const HEADER_STYLE: React.CSSProperties = {
    padding: '0.35rem 0.75rem 0.15rem',
    fontSize: '0.72rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: '#888',
}

const DIVIDER: React.CSSProperties = {
    height: 1,
    background: '#eee',
    margin: '4px 0',
}

export function AllocateContextMenu({
    x,
    y,
    grades,
    tares,
    targetCount,
    canAutofill,
    onAutofillAll,
    onFillTare,
    onAssignGrade,
    onClose,
}: AllocateContextMenuProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    return (
        <>
            <div
                onClick={onClose}
                onContextMenu={(e) => {
                    e.preventDefault()
                    onClose()
                }}
                style={{ position: 'fixed', inset: 0, zIndex: 900 }}
            />
            <div
                style={{
                    position: 'fixed',
                    top: y,
                    left: x,
                    zIndex: 1000,
                    background: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                    minWidth: 220,
                    paddingTop: 4,
                    paddingBottom: 4,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={canAutofill ? ROW_STYLE : ROW_DISABLED_STYLE}
                    onClick={canAutofill ? onAutofillAll : undefined}
                >
                    Autofill to tare ({targetCount})
                </div>
                {tares.length > 0 && (
                    <>
                        <div style={DIVIDER} />
                        <div style={HEADER_STYLE}>Fill into</div>
                        {tares.map((t) => {
                            const free = Math.max(0, t.capacity - t.occupied)
                            const enabled = canAutofill && free > 0
                            return (
                                <div
                                    key={t.id}
                                    style={
                                        enabled ? ROW_STYLE : ROW_DISABLED_STYLE
                                    }
                                    onClick={
                                        enabled
                                            ? () => onFillTare(t.id)
                                            : undefined
                                    }
                                >
                                    <span style={{ flex: 1 }}>
                                        {t.barcode || t.tareTypeName || 'Tare'}
                                    </span>
                                    <small style={{ color: '#888' }}>
                                        {t.occupied}/{t.capacity}
                                    </small>
                                </div>
                            )
                        })}
                    </>
                )}
                {grades.length > 0 && (
                    <>
                        <div style={DIVIDER} />
                        <div style={HEADER_STYLE}>Grades</div>
                        {grades.map((g) => (
                            <div
                                key={g.id}
                                style={ROW_STYLE}
                                onClick={() => onAssignGrade(g.id)}
                            >
                                <span
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 3,
                                        background:
                                            colorForGradeId(g.id) ?? '#eee',
                                        border: '1px solid rgba(0,0,0,0.15)',
                                    }}
                                />
                                {g.name}
                            </div>
                        ))}
                        <div
                            style={ROW_STYLE}
                            onClick={() => onAssignGrade(undefined)}
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
                            (No grade)
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
