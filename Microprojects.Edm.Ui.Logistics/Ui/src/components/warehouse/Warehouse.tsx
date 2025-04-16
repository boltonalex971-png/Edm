import React from 'react';
import {useRouteMatch} from "@logistics/hooks/routerHooks";
import {PageTitle} from "@logistics/components/PageTitle.tsx";
import {Nav, NavItem, NavLink} from "reactstrap";
import {NavLink as Link} from "react-router";

export function Warehouse() {
    let { path } = useRouteMatch();

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <PageTitle title="Warehouse" />
            </div>
            <hr />
            <div>
                <span>List of available products, parts and materials</span>
            </div>
        </>
    );
}
