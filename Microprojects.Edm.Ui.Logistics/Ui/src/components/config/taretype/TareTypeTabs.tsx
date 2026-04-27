import type { UUID } from '@logistics/data/types'
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout'
import { useState } from 'react'
import { TareTypeNomenclaturesTab } from './TareTypeNomenclaturesTab'

type TareTypeTabsProps = {
    id: UUID
    api: string
    onDetailSelected: Function
}

export function TareTypeTabs(props: TareTypeTabsProps) {
    const [selected, setSelected] = useState(0)
    return (
        <TabStrip selected={selected} onSelect={(e) => setSelected(e.selected)}>
            <TabStripTab title="Allowed nomenclatures">
                <TareTypeNomenclaturesTab {...props} />
            </TabStripTab>
        </TabStrip>
    )
}
