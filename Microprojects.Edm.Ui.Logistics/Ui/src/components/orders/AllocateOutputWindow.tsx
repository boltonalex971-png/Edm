import { AllocateProcessOutput } from '@logistics/components/orders/AllocateProcessOutput'
import type { UUID } from '@logistics/data/types'
import { Window } from '@progress/kendo-react-dialogs'
import { useEffect, useMemo } from 'react'

type AllocateOutputWindowProps = {
    orderId: UUID
    onClose: () => void
    onChanged?: () => void
}

// Lock the Window body so only the inner scroll wrapper scrolls; keeps the
// sticky toolbar in AllocateProcessOutput pinned to the top of the viewport
// without a secondary Window-level scrollbar appearing.
const SCOPED_CSS = `
.allocate-output-window {
    position: fixed !important;
}
.allocate-output-window > .k-window-content {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
}
.allocate-output-window > .k-window-content > .repacking-page {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0;
}
`

export function AllocateOutputWindow({
    orderId,
    onClose,
    onChanged,
}: AllocateOutputWindowProps) {
    const { w, h, top, left } = useMemo(() => {
        const w = Math.round(window.innerWidth * 0.9)
        const h = Math.round(window.innerHeight * 0.9)
        return {
            w,
            h,
            top: Math.round((window.innerHeight - h) / 2),
            left: Math.round((window.innerWidth - w) / 2),
        }
    }, [])

    useEffect(() => {
        const prevBody = document.body.style.overflow
        const prevHtml = document.documentElement.style.overflow
        document.body.style.overflow = 'hidden'
        document.documentElement.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prevBody
            document.documentElement.style.overflow = prevHtml
        }
    }, [])

    return (
        <>
            <style>{SCOPED_CSS}</style>
            <Window
                className="allocate-output-window"
                title="Allocate process output"
                onClose={onClose}
                initialWidth={w}
                initialHeight={h}
                initialTop={top}
                initialLeft={left}
                modal
            >
                <AllocateProcessOutput
                    orderId={orderId}
                    onClose={onClose}
                    onChanged={onChanged}
                />
            </Window>
        </>
    )
}
