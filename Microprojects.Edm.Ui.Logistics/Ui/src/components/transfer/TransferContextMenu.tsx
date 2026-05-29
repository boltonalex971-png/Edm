import '@logistics/components/transfer' // side-effect: registers the `transfer` namespace
import type { LegendEntry } from '@logistics/components/transfer/visibleFromItems'
import type { TareInfo, UUID } from '@logistics/data/types'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export type ContextTareOption = TareInfo & {
    occupied: number
    capacity: number
}

type TransferContextMenuProps = {
    x: number
    y: number
    tares: ContextTareOption[]
    targetCount: number
    canAutofill: boolean
    onAutofillAll: () => void
    onFillTare: (tareId: UUID) => void
    /** Grade section is hidden unless both `grades` and `onAssignGrade` are provided. */
    grades?: LegendEntry[]
    onAssignGrade?: (gradeId: UUID | undefined) => void
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
    color: 'var(--ink-disabled)',
    cursor: 'default',
}

const HEADER_STYLE: React.CSSProperties = {
    padding: '0.35rem 0.75rem 0.15rem',
    fontSize: '0.72rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
}

const DIVIDER: React.CSSProperties = {
    height: 1,
    background: 'var(--line-soft)',
    margin: '4px 0',
}

export function TransferContextMenu({
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
}: TransferContextMenuProps) {
    const { t } = useTranslation('transfer')
    const showGrades = !!grades && grades.length > 0 && !!onAssignGrade
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
                    background: 'var(--surface)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: 'var(--r-3)',
                    boxShadow: 'var(--elev-popover)',
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
                    {t('menu.autofill', { count: targetCount })}
                </div>
                {tares.length > 0 && (
                    <>
                        <div style={DIVIDER} />
                        <div style={HEADER_STYLE}>{t('menu.fillInto')}</div>
                        {tares.map((tare) => {
                            const free = Math.max(0, tare.capacity - tare.occupied)
                            const enabled = canAutofill && free > 0
                            return (
                                <div
                                    key={tare.id}
                                    style={
                                        enabled ? ROW_STYLE : ROW_DISABLED_STYLE
                                    }
                                    onClick={
                                        enabled
                                            ? () => onFillTare(tare.id)
                                            : undefined
                                    }
                                >
                                    <span style={{ flex: 1 }}>
                                        {tare.barcode || tare.tareTypeName || t('menu.fallbackTareLabel')}
                                    </span>
                                    <small style={{ color: 'var(--ink-3)' }}>
                                        {tare.occupied}/{tare.capacity}
                                    </small>
                                </div>
                            )
                        })}
                    </>
                )}
                {showGrades && (
                    <>
                        <div style={DIVIDER} />
                        <div style={HEADER_STYLE}>{t('menu.gradesHeader')}</div>
                        {grades!.map((g) => (
                            <div
                                key={g.id}
                                style={ROW_STYLE}
                                onClick={() => onAssignGrade!(g.id)}
                            >
                                <span
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 3,
                                        background:
                                            g.color ?? 'var(--surface-3)',
                                        border: '1px solid rgba(0,0,0,0.15)',
                                    }}
                                />
                                {g.name}
                            </div>
                        ))}
                        <div
                            style={ROW_STYLE}
                            onClick={() => onAssignGrade!(undefined)}
                        >
                            <span
                                style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 3,
                                    background: 'var(--surface-3)',
                                    border: '1px solid var(--line-strong)',
                                }}
                            />
                            {t('menu.noGrade')}
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
