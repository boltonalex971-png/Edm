import type { UUID } from '@logistics/data/types'
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout'
import { useState } from 'react'
import { NomenclatureTaresTab } from './NomenclatureTaresTab'

type NomenclatureTabsProps = {
    id: UUID
    api: string
    onDetailSelected: Function
}

export function NomenclatureTabs(props: NomenclatureTabsProps) {
    const [selected, setSelected] = useState(0)
    return (
        <TabStrip selected={selected} onSelect={(e) => setSelected(e.selected)}>
            <TabStripTab title="Allowed tares">
                <NomenclatureTaresTab {...props} />
            </TabStripTab>
        </TabStrip>
    )
}
