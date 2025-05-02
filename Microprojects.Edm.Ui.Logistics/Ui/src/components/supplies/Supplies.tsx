import React, {MouseEventHandler, useState} from 'react';
import {useRouteMatch} from "@logistics/hooks/routerHooks";
import {PageTitle} from "@logistics/components/PageTitle";
import {Nav, NavItem, NavLink} from "reactstrap";
import {NavLink as Link} from "react-router";
import {ResizableHandle, SmartScroll, SmartScrollContent} from "@logistics/components/SmartScroll";
import {Splitter} from "@progress/kendo-react-layout";
import {Button} from "@progress/kendo-react-buttons";
import {Asterisk, ChevronLeft, Download, InfoCircle, Pen, Search, Star} from "react-bootstrap-icons";
import {Input, InputPrefix, TextBox} from "@progress/kendo-react-inputs";
import {SupplyEditorPanel} from "@logistics/components/supplies/SupplyEditorPanel";
import {TreeViewMaster} from "@logistics/components/TreeViewMaster";
import api from "@features/api/api";
import {TreeViewLink} from "@logistics/components/TreeViewLink";
import {Slide} from "@progress/kendo-react-animation";
import {stringify} from "node:querystring";
import {Grid, GridColumn} from "@progress/kendo-react-grid";
import {LinkTextCell} from "@logistics/components/DropDownCell";
import {useGet} from "@logistics/hooks/hooks";
import {Item} from "@logistics/data/types";
import {Loading} from "@features/utils/Utils.tsx";
import {Error} from "@progress/kendo-react-labels";

export function Supplies() {
    let {path} = useRouteMatch();
    const [panel, setPanel] = useState<'search' | 'create'>('search')
    const [linkPanel, setLinkPanel] = useState<string>()
    const searchClick = (e) => {
        setPanel('search')
        setLinkPanel(undefined)
    }
    const createClick = (e) => {
        setPanel('create')
        setLinkPanel(undefined)
    }

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
                <SmartScroll offtop={10}>
                    <SmartScrollContent flex={1}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            gap: '1rem',
                                        }}
                    >
                        <div style={{height: '1em'}}></div>
                        <Button type={'button'} fillMode={'flat'} onClick={searchClick}><Search/> Search</Button>
                        <Button type={'button'} fillMode={'flat'} onClick={createClick}><Pen/> Create new</Button>
                        <Button fillMode={'flat'}><Download/> Get from accounting system</Button>
                    </SmartScrollContent>
                    <SmartScrollContent flex={4}>
                        {panel === 'search' && <SearchPanel/>}
                        {panel === 'create' && !linkPanel &&
                            <SupplyEditorPanel onLink={setLinkPanel} api={api.supplies}/>}
                        {panel === 'create' && linkPanel &&
                            <LinkPanel api={linkPanel} onClose={() => setLinkPanel(undefined)}/>}
                    </SmartScrollContent>
                </SmartScroll>
            </div>
        </>
    );
}

function SearchPanel() {
    const [[data], loading, error] = useGet<Item[]>(`${api.supplies}`, [api]);
    return (
        <>
            <TextBox inputMode={'text'}
                     placeholder={'Search by shipment or barcode'}
                     prefix={() =>
                         <InputPrefix>
                             <Search width={30}/>
                         </InputPrefix>
                     }
                     style={{marginBottom: '1rem'}}
            />
            {loading && <Loading />}
            {error && <Error>{error}</Error>}
            {data &&
                <Grid data={data} scrollable='none'>
                    <GridColumn field='nomenclatureName' title='Nomenclature' cell={p => <LinkTextCell {...p}/>}/>
                    <GridColumn field='tareTareTypeName' title='Tare' />
                    <GridColumn field='quantity' title='Quantity' />
                    <GridColumn field='tareTareTypeUnit' title='Units' />
                    <GridColumn field='metaCreated' title='Created' />
                </Grid>
            }
        </>
    )
}

type LinkPanelProps = {
    onClose: () => void;
    api: string
}

function LinkPanel({api, onClose}: LinkPanelProps) {
    return (
        <>
            <button onClick={onClose}
                    style={{backgroundColor: 'transparent', border: 'transparent'}}>
                <ChevronLeft/> Back
            </button>
            <p className={'small'} style={{textAlign: 'center'}}>
                <InfoCircle/> Double click on item to link
            </p>
            <TreeViewLink api={api} onCurrentRootChanged={(root) => {
            }}/>
            <SmartScrollContent flex={2} style={{paddingLeft: '2rem'}}>
                <div style={{height: '1em'}}></div>
                {/*{linkPanel && <LinkPanel api={linkPanel}/>}*/}
            </SmartScrollContent>
        </>
    )
}
