import React, {useState} from 'react';
import {useRouteMatch} from "@logistics/hooks/routerHooks";
import {PageTitle} from "@logistics/components/PageTitle";
import {Nav, NavItem, NavLink} from "reactstrap";
import {NavLink as Link} from "react-router";
import {SmartScroll, SmartScrollContent} from "@logistics/components/SmartScroll";
import {ChevronLeft, InfoCircle} from "react-bootstrap-icons";
import {TreeViewLink} from "@logistics/components/TreeViewLink";
import {Search} from "@logistics/components/Search"
import Api from "@features/api/api.ts";
import {useParams} from "react-router-dom";
import {OrderDetail} from "@logistics/components/orders/OrderDetail";
import {OrderSearch} from "@logistics/components/orders/OrderSearch.tsx";

export function Orders() {
    let {path} = useRouteMatch();
    const param = useParams();
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
                <PageTitle title="Orders"/>
                <Nav pills>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/ongoing`}>Ongoing</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/completed`}>Completed</NavLink>
                    </NavItem>
                </Nav>
            </div>
            <hr/>
            <div>
                <Search api={Api.orders}
                        stubMessage={'Select an action'}
                        type={'none'}
                        search={<OrderSearch/>}
                        detail={<OrderDetail title='New Order' editMode={true} api={Api.orders}/>}
                />
            </div>
        </>
    );
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
