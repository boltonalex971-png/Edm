import React, {type EffectCallback, useEffect, useMemo, useState} from 'react';
import {useRouteMatch} from "@logistics/hooks/routerHooks";
import {PageTitle} from "@logistics/components/PageTitle";
import {Nav, NavItem, NavLink} from "reactstrap";
import {NavLink as Link} from "react-router";
import {Diagram3, Search as SearchIcon} from "react-bootstrap-icons";
import {InputPrefix, TextBox, type TextBoxChangeEvent} from "@progress/kendo-react-inputs";
import api from "@features/api/api";
import {TreeViewLink} from "@logistics/components/TreeViewLink";
import {Grid, GridColumn, type GridPageChangeEvent, type GridRowClickEvent} from "@progress/kendo-react-grid";
import {LinkTextCell} from "@logistics/components/DropDownCell";
import {useGet} from "@logistics/hooks/hooks";
import {Supply} from "@logistics/data/types";
import {Loading} from "@features/utils/Utils.tsx";
import {Error} from "@progress/kendo-react-labels";
import {Search} from "@logistics/components/Search";
import {process} from "@progress/kendo-data-query";
import {Detail} from "@logistics/components/MasterDetail";
import {SupplyDetail} from "@logistics/components/supplies/SupplyDetail";

export function Supplies() {
    let {path} = useRouteMatch();

    return (
        <>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <PageTitle title="Supplies"/>
                <Nav pills>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/remaining`}>Remains</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/consumed`}>Consumed</NavLink>
                    </NavItem>
                </Nav>
            </div>
            <hr/>
            <div>
                <Search
                    api={api.supplies}
                    stubMessage={'Select an action'}
                    type={'none'}
                    path={path}
                    search={<SupplySearch/>}
                    detail={<SupplyDetail title='New Supply' editMode={true} api={api.supplies}/>}
                />
            </div>
        </>
    );
}

function SupplySearch() {
    const [[data], loading, error] = useGet<Supply[]>(`${api.supplies}`, [api]);
    const [page, setPage] = useState({skip: 0, take: 10});
    const [filter, setFilter] = useState<string>('');
    const [subDetail, setSubDetail] = useState<React.ReactElement>()

    useEffect(setSubDetail as EffectCallback, []);

    const filteredData = useMemo(() => {
        const lower = filter.toLowerCase();
        if (!lower) {
            return data || [];
        }

        return (data || []).filter(s =>
            s.barcode?.toLowerCase().includes(lower) ||
            s.shipment?.toLowerCase().includes(lower) ||
            s.shipmentExternalId?.toLowerCase().includes(lower)
        );
    }, [data, filter]);

    const gridData = process(filteredData, {skip: page.skip, take: page.take});

    const pageChange = (event: GridPageChangeEvent) => {
        const take = 10;
        setPage({
            ...event.page,
            take
        });
    };

    const filterChange = (event: TextBoxChangeEvent) => {
        setPage({skip: 0, take: 10});
        setFilter(event.value?.toString() || '');
    };

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
            />
        )
    }

    return (
        <Detail
            onClose={() => {}}
            icon={<Diagram3 title='Supplies'/>}
            loading={loading}
            error={error as any}
            data={{
                name: 'Supply search',
                description: 'Search for supplies'
            } as any}
            subDetail={subDetail}
            card={
                <>
                    <TextBox inputMode={'text'}
                             placeholder={'Search by shipment or barcode'}
                             prefix={() =>
                                 <InputPrefix>
                                     <SearchIcon width={30}/>
                                 </InputPrefix>
                             }
                             style={{marginBottom: '1rem'}}
                             onChange={filterChange}
                    />
                    {loading && <Loading />}
                    {error && <Error>{error}</Error>}
                    {data &&
                        <Grid
                            data={gridData}
                            scrollable='none'
                            pageable={true}
                            pageSize={10}
                            skip={page.skip}
                            take={page.take}
                            total={gridData.total}
                            onPageChange={pageChange}
                            onRowClick={rowClicked}
                        >
                            <GridColumn field='barcode' title='Barcode' />
                            <GridColumn field='shipment' title='Shipment' />
                            <GridColumn field='shipmentExternalId' title='Shipment Id' />
                            <GridColumn field='metaCreated' title='Created' />
                        </Grid>
                    }
                </>
            }
        />
    )
}
