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
import {ItemSearch} from "@logistics/components/items/ItemSearch.tsx";
import {ItemDetail} from "@logistics/components/items/ItemDetail.tsx";

export function Items() {
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
                        <NavLink tag={Link} to={`${path}/remaining`}>Remains</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/consumed`}>Consumed</NavLink>
                    </NavItem>
                </Nav>
            </div>
            <hr/>
            <div>
                <Search api={Api.supplies}
                        stubMessage={'Select an action'}
                        type={'none'}
                        search={<ItemSearch />}
                        detail={<ItemDetail title='New Item' editMode={true} api={Api.supplies}/>}
                />
            </div>
        </>
    );
}

