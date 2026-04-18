import api from '@features/api/api.ts'
import Api from '@features/api/api.ts'
import { Loading } from '@features/utils/Utils'
import { LinkTextCell } from '@logistics/components/DropDownCell'
import { Detail } from '@logistics/components/MasterDetail'
import { DateCell } from '@logistics/components/RelationTable'
import { NomenclatureDetail } from '@logistics/components/config/nomenclature/Nomenclatures'
import { ProcessDetail } from '@logistics/components/config/process/Processes'
import { OrderDetail } from '@logistics/components/orders/OrderDetail'
import {
    type DataItem,
    Item,
    type ItemSearchQuery,
    type Order,
} from '@logistics/data/types'
import { useGet, usePost } from '@logistics/hooks/hooks.ts'
import { process } from '@progress/kendo-data-query'
import {
    Grid,
    GridColumn,
    type GridPageChangeEvent,
} from '@progress/kendo-react-grid'
import {
    InputPrefix,
    TextBox,
    type TextBoxChangeEvent,
} from '@progress/kendo-react-inputs'
import { Error } from '@progress/kendo-react-labels'
import React, { type ReactElement, useMemo, useState } from 'react'
import { Diagram3, Search } from 'react-bootstrap-icons'

type OrderSearchProps = {
    query?: ItemSearchQuery
}
interface PageState {
    skip: number
    take: number
}
const initialDataState: PageState = { skip: 0, take: 10 }

export const OrderSearch = (props: OrderSearchProps) => {
    const [[orders], loading, error] = usePost<Order[]>(
        `${api.orders}/search`,
        props.query || {},
        [props.query?.nomenclatureId, props.query?.active],
    )
    const [subDetail, setSubDetail] = useState<ReactElement | undefined>()
    const [page, setPage] = React.useState<PageState>(initialDataState)
    const [filter, setFilter] = useState<string>('')

    const filteredData = useMemo(() => {
        const lowerCasedFilter = filter.toLowerCase()
        const result = orders?.filter(
            (o) =>
                o.processName?.toLowerCase().includes(lowerCasedFilter) ||
                o.processNomenclatureName
                    ?.toLowerCase()
                    .includes(lowerCasedFilter) ||
                o.description?.toLowerCase().includes(lowerCasedFilter),
        )
        return result
    }, [filter, api, orders])
    const data = process(filteredData || [], {
        skip: page.skip,
        take: page.take,
    })

    const pageChange = (event: GridPageChangeEvent) => {
        const take = 10
        setPage({
            ...event.page,
            take,
        })
    }
    const filterChange = (event: TextBoxChangeEvent) => {
        setPage(initialDataState)
        setFilter(event.value?.toString() || '')
    }

    return (
        <Detail
            icon={<Diagram3 title="Process" />}
            loading={loading}
            error={error as string}
            data={
                {
                    name: 'Order search',
                    description: 'Search for orders',
                } as DataItem
            }
            subDetail={subDetail}
            card={
                <>
                    <TextBox
                        inputMode={'text'}
                        placeholder={'Search by process or nomenclature'}
                        prefix={() => (
                            <InputPrefix>
                                <Search width={30} />
                            </InputPrefix>
                        )}
                        style={{ marginBottom: '1rem' }}
                        onChange={filterChange}
                    />
                    {loading && <Loading />}
                    {error && <Error>{error}</Error>}
                    {data && (
                        <Grid
                            data={data}
                            scrollable="none"
                            pageable={true}
                            pageSize={10}
                            skip={page.skip}
                            take={page.take}
                            total={data.total}
                            onPageChange={pageChange}
                            onRowClick={(event) =>
                                setSubDetail(
                                    <OrderDetail
                                        id={event.dataItem.id}
                                        api={Api.orders}
                                        onClose={() => setSubDetail(undefined)}
                                        //onUpdate={event.itemUpdate}
                                    />,
                                )
                            }
                        >
                            <GridColumn
                                field="processName"
                                title="Process"
                                cell={(p) => (
                                    <LinkTextCell
                                        {...p}
                                        fieldId="processId"
                                        onClick={(id, itemUpdate) =>
                                            setSubDetail(
                                                <ProcessDetail
                                                    processId={id}
                                                    api={Api.processes}
                                                    onClose={() =>
                                                        setSubDetail(undefined)
                                                    }
                                                    onUpdate={itemUpdate}
                                                />,
                                            )
                                        }
                                    />
                                )}
                            />
                            <GridColumn
                                field="processNomenclatureName"
                                title="Nomenclature"
                                cell={(p) => (
                                    <LinkTextCell
                                        {...p}
                                        fieldId="processNomenclatureId"
                                        onClick={(id, itemUpdate) =>
                                            setSubDetail(
                                                <NomenclatureDetail
                                                    id={id}
                                                    api={Api.nomenclatures}
                                                    onClose={() =>
                                                        setSubDetail(undefined)
                                                    }
                                                    onUpdate={itemUpdate}
                                                />,
                                            )
                                        }
                                    />
                                )}
                            />
                            <GridColumn field="amount" title="Amount" />
                            <GridColumn
                                field="description"
                                title="Description"
                            />
                            <GridColumn
                                field="startDate"
                                title="Start"
                                cell={DateCell}
                            />
                            <GridColumn
                                field="dueDate"
                                title="Due"
                                cell={DateCell}
                            />
                        </Grid>
                    )}
                    <div className="mt-2" />
                </>
            }
        />
    )
}
