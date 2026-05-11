import api from '@features/api/api'
import { Loading } from '@features/utils/Utils.tsx'
import { Detail } from '@logistics/components/MasterDetail'
import { DateTimeCell } from '@logistics/components/RelationTable'
import { SupplyDetail } from '@logistics/components/supplies/SupplyDetail'
import type { Supply } from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks'
import { SubRootPage } from '@microprojects/edm-components/components/chrome/SubRootPage'
import { useBasePath } from '@microprojects/edm-components/hooks/useBasePath'
import { Search } from '@microprojects/edm-components/components/page/Search'
import {
    Add as AddIcon,
    CheckCircleOutlined as ConsumedIcon,
    Inventory2Outlined as RemainsIcon,
    Search as SearchIcon,
} from '@mui/icons-material'
import { process } from '@progress/kendo-data-query'
import {
    Grid,
    GridColumn,
    type GridPageChangeEvent,
    type GridRowClickEvent,
} from '@progress/kendo-react-grid'
import {
    InputPrefix,
    TextBox,
    type TextBoxChangeEvent,
} from '@progress/kendo-react-inputs'
import { Error } from '@progress/kendo-react-labels'
import type React from 'react'
import { type EffectCallback, useEffect, useMemo, useState } from 'react'
import { Diagram3 } from 'react-bootstrap-icons'

export function Supplies() {
    const path = useBasePath()

    const menuItems = [
        { label: 'Remains', path: `${path}/remaining`, icon: <RemainsIcon fontSize="small" /> },
        { label: 'Consumed', path: `${path}/consumed`, icon: <ConsumedIcon fontSize="small" /> },
    ]

    return (
        <SubRootPage title="Supplies" menuItems={menuItems}>
            <Search
                actions={[
                    {
                        key: 'search',
                        label: 'Search',
                        icon: <SearchIcon fontSize="small" />,
                        panel: <SupplySearch />,
                    },
                    {
                        key: 'create',
                        label: 'Create new',
                        icon: <AddIcon fontSize="small" />,
                        panel: (
                            <SupplyDetail
                                title="New Supply"
                                editMode={true}
                                api={api.supplies}
                            />
                        ),
                    },
                ]}
            />
        </SubRootPage>
    )
}

function SupplySearch() {
    const [[data], loading, error] = useGet<Supply[]>(`${api.supplies}`, [api])
    const [page, setPage] = useState({ skip: 0, take: 10 })
    const [filter, setFilter] = useState<string>('')
    const [subDetail, setSubDetail] = useState<React.ReactElement>()

    useEffect(setSubDetail as EffectCallback, [])

    const filteredData = useMemo(() => {
        const lower = filter.toLowerCase()
        if (!lower) {
            return data || []
        }

        return (data || []).filter(
            (s) =>
                s.barcode?.toLowerCase().includes(lower) ||
                s.shipment?.toLowerCase().includes(lower) ||
                s.shipmentExternalId?.toLowerCase().includes(lower),
        )
    }, [data, filter])

    const gridData = process(filteredData, { skip: page.skip, take: page.take })

    const pageChange = (event: GridPageChangeEvent) => {
        const take = 10
        setPage({
            ...event.page,
            take,
        })
    }

    const filterChange = (event: TextBoxChangeEvent) => {
        setPage({ skip: 0, take: 10 })
        setFilter(event.value?.toString() || '')
    }

    const rowClicked = (event: GridRowClickEvent) => {
        const id = event.dataItem?.id
        if (!id) {
            return
        }
        setSubDetail(
            <SupplyDetail
                readonly={true}
                id={id}
                api={api.supplies}
                onClose={() => setSubDetail(undefined)}
            />,
        )
    }

    return (
        <Detail
            onClose={() => {}}
            icon={<Diagram3 title="Supplies" />}
            loading={loading}
            error={error as any}
            data={
                {
                    name: 'Supply search',
                    description: 'Search for supplies',
                } as any
            }
            subDetail={subDetail}
            card={
                <>
                    <TextBox
                        inputMode={'text'}
                        placeholder={'Search by shipment or barcode'}
                        prefix={() => (
                            <InputPrefix>
                                <SearchIcon fontSize="small" />
                            </InputPrefix>
                        )}
                        style={{ marginBottom: '1rem' }}
                        onChange={filterChange}
                    />
                    {loading && <Loading />}
                    {error && <Error>{error}</Error>}
                    {data && (
                        <Grid
                            data={gridData}
                            scrollable="none"
                            pageable={true}
                            pageSize={10}
                            skip={page.skip}
                            take={page.take}
                            total={gridData.total}
                            onPageChange={pageChange}
                            onRowClick={rowClicked}
                        >
                            <GridColumn field="barcode" title="Barcode" />
                            <GridColumn field="shipment" title="Shipment" />
                            <GridColumn
                                field="shipmentExternalId"
                                title="Shipment Id"
                            />
                            <GridColumn
                                field="metaCreated"
                                title="Created"
                                cell={DateTimeCell}
                            />
                        </Grid>
                    )}
                </>
            }
        />
    )
}
