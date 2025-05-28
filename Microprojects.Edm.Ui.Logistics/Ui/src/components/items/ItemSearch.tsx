import React, {ReactElement, useEffect, useMemo, useState} from 'react';
import {Diagram3, Search} from "react-bootstrap-icons";
import api from "@features/api/api.ts";
import {useGet, usePost} from "@logistics/hooks/hooks.ts";
import {DataItem, Item, ItemSearchQuery, Order} from "@logistics/data/types";
import {InputPrefix, TextBox, TextBoxChangeEvent} from "@progress/kendo-react-inputs";
import {Loading} from "@features/utils/Utils";
import {Error} from "@progress/kendo-react-labels";
import {Grid, GridColumn, GridPageChangeEvent, GridRowClickEvent} from "@progress/kendo-react-grid";
import {LinkTextCell} from "@logistics/components/DropDownCell";
import Api from "@features/api/api.ts";
import {ProcessDetail} from "@logistics/components/config/process/Processes";
import {NomenclatureDetail} from "@logistics/components/config/nomenclature/Nomenclatures";
import {Detail} from "@logistics/components/MasterDetail";
import {process} from "@progress/kendo-data-query"
import {AlertState, InlineAlert} from "@logistics/components/InlineAlert.tsx";

type ItemSearchProps = {
    onClose: () => void
    query?: ItemSearchQuery
    lookup?: React.ReactElement | boolean
    selected?: (item: Item, setAlert: (alertState: AlertState) => void) => void
}

interface PageState {
    skip: number;
    take: number;
}

const initialDataState: PageState = {skip: 0, take: 10};
let refresh: boolean = false;

export const ItemSearch = (props: ItemSearchProps) => {
    const [[items], loading, error] = usePost<Item[]>(`${api.supplies}/search`, props.query, [props.query?.nomenclatureId, refresh]);
    const [subDetail, setSubDetail] = useState<ReactElement | undefined>();
    const [page, setPage] = React.useState<PageState>(initialDataState);
    const [filter, setFilter] = useState<string>('');
    const [alert, setAlert] = useState<AlertState>();

    useEffect(() => {
        setAlert(undefined)
    }, [props.query?.nomenclatureId])
    
    const filteredData = useMemo(() => {
        const lowerCasedFilter = filter.toLowerCase();
        const result = items?.filter(o =>
            o.nomenclatureName?.toLowerCase().includes(lowerCasedFilter) ||
            o.tareTareTypeName?.toLowerCase().includes(lowerCasedFilter)
        )
        return result
    }, [filter, api, items]);
    const data = process(filteredData || [], {skip: page.skip, take: page.take});

    const pageChange = (event: GridPageChangeEvent) => {
        const take = 10
        setPage({
            ...event.page,
            take
        });
    };
    const filterChange = (event: TextBoxChangeEvent) => {
        setPage(initialDataState)
        setFilter(event.value?.toString() || '')
    }

    const rowClicked = (event: GridRowClickEvent) => {
        if (typeof props.lookup === 'boolean') {
            props.lookup && props.selected && props.selected(event.dataItem, setAlert)
            refresh = !refresh;
        }
        if (typeof props.lookup === 'object') {
            console.log('open dialog and pass selected there')
        }
    }

    return (
        <Detail
            onClose={props.onClose}
            icon={<Diagram3 title='Components'/>}
            loading={loading}
            error={error as string}
            data={{
                name: `Component ${props.lookup ? 'lookup' : 'search'}`,
                description: props.lookup ? 'Binding component to the order' : 'Search for components'
            } as DataItem}
            subDetail={subDetail}
            card={
                <>
                    <TextBox inputMode={'text'}
                             placeholder={'Search by nomenclature or tare'}
                             prefix={() =>
                                 <InputPrefix>
                                     <Search width={30}/>
                                 </InputPrefix>
                             }
                             style={{marginBottom: '1rem'}}
                             onChange={filterChange}
                    />
                    {loading && <Loading/>}
                    {error && <Error>{error}</Error>}
                    {data &&
                        <>
                            <InlineAlert state={alert} onClose={() => setAlert(undefined)}></InlineAlert>
                            <Grid data={data} /* TODO use RelationTable */
                                  scrollable='none'
                                  pageable={true}
                                  pageSize={10}
                                  skip={page.skip}
                                  take={page.take}
                                  total={data.total}
                                  onPageChange={pageChange}
                                  onRowDoubleClick={rowClicked}
                                // onRowClick={(event) => setSubDetail(
                                //     <OrderDetail
                                //         id={event.dataItem.id}
                                //         api={Api.orders}
                                //         onClose={() => setSubDetail(undefined)}
                                //         //onUpdate={event.itemUpdate}
                                //     />
                                // )}
                            >
                                <GridColumn field='serialNo' title='Serial No' width='100'/>
                                <GridColumn field='nomenclatureName' title='Nomenclature' cell={p =>
                                    <LinkTextCell {...p} fieldId='nomenclatureId'
                                                  onClick={(id, itemUpdate) => setSubDetail(
                                                      <NomenclatureDetail
                                                          id={id}
                                                          api={Api.nomenclatures}
                                                          onClose={() => setSubDetail(undefined)}
                                                          onUpdate={itemUpdate}
                                                      />
                                                  )}
                                    />
                                }/>
                                <GridColumn field='tareTareTypeName' title='Tare'/>
                                <GridColumn field='tareBarcode' title='Barecode'/>
                                <GridColumn field='quantity' title='Quantity'/>
                                <GridColumn field='tareTareTypeUnits' title='Units'/>
                            </Grid>
                        </>
                    }
                    <div className="mt-2"/>
                </>
            }
        />
    )
}
