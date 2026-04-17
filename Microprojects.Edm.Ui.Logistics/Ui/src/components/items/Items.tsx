import React, {useEffect, useState} from 'react';
import {useRouteMatch} from "@logistics/hooks/routerHooks";
import {PageTitle} from "@logistics/components/PageTitle";
import {Nav, NavItem, NavLink} from "reactstrap";
import {NavLink as Link} from "react-router";
import {Search} from "@logistics/components/Search"
import Api from "@features/api/api.ts";
import {useParams} from "react-router-dom";
import {ItemSearch} from "@logistics/components/items/ItemSearch.tsx";
import {BatchItemCreate} from "@logistics/components/items/BatchItemCreate.tsx";
import {ItemSearchQuery} from "@logistics/data/types";

export function Items() {
    let {path, name} = useRouteMatch();
    const param = useParams();
    const [panel, setPanel] = useState<'search' | 'create'>('search')
    const [linkPanel, setLinkPanel] = useState<string>()
    const [query, setQuery] = useState<ItemSearchQuery>()
    useEffect(() => {
        setQuery({active: name.includes('remaining')})     
    }, [name])
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
                <PageTitle title="Items"/>
                <Nav pills>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/remaining`}>Available</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/consumed`}>Consumed</NavLink>
                    </NavItem>
                </Nav>
            </div>
            <hr/>
            <div>
                <Search api={Api.items}
                        stubMessage={'Select an action'}
                        type={'none'}
                        search={<ItemSearch query={query} />}
                        detail={<BatchItemCreate />}
                />
            </div>
        </>
    );
}

