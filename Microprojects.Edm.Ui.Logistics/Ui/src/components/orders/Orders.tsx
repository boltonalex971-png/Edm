import Api from '@features/api/api.ts'
import { PageTitle } from '@logistics/components/PageTitle'
import { Search } from '@logistics/components/Search'
import { TreeViewLink } from '@logistics/components/TreeViewLink'
import { OrderDetail } from '@logistics/components/orders/OrderDetail'
import { OrderSearch } from '@logistics/components/orders/OrderSearch.tsx'
import type { OrderSearchQuery, UUID } from '@logistics/data/types'
import { useRouteMatch } from '@logistics/hooks/routerHooks'
import { SmartScrollContent } from '@microprojects/tools'
import React, { useEffect, useState } from 'react'
import { ChevronLeft, InfoCircle } from 'react-bootstrap-icons'
import { NavLink as Link } from 'react-router'
import { useParams } from 'react-router-dom'
import { Nav, NavItem, NavLink } from 'reactstrap'

export function Orders() {
    const { path, name } = useRouteMatch()
    const param = useParams()
    const [panel, setPanel] = useState<'search' | 'create'>('search')
    const [linkPanel, setLinkPanel] = useState<string>()
    const [query, setQuery] = useState<OrderSearchQuery>()
    // After a successful Create, flip the Create-panel from the empty
    // "New Order" form to a view-mode detail of the just-created order.
    // Cleared via the detail's Close button so the user can create another.
    const [createdOrderId, setCreatedOrderId] = useState<UUID>()
    useEffect(() => {
        setQuery({ active: name.includes('ongoing') })
    }, [name])
    const searchClick = (e) => {
        setPanel('search')
        setLinkPanel(undefined)
    }
    const createClick = (e) => {
        setPanel('create')
        setLinkPanel(undefined)
    }

    const detail = createdOrderId ? (
        <OrderDetail
            key={createdOrderId}
            id={createdOrderId}
            api={Api.orders}
            type="order"
            onClose={() => setCreatedOrderId(undefined)}
        />
    ) : (
        <OrderDetail
            key="new"
            title="New Order"
            editMode={true}
            api={Api.orders}
            type="order"
            onChange={(d) => {
                const newId = (d as { id?: UUID } | undefined)?.id
                if (newId) setCreatedOrderId(newId)
            }}
        />
    )

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <PageTitle title="Orders" />
                <Nav pills>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/ongoing`}>
                            Active
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/completed`}>
                            Completed
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>
            <hr />
            <div>
                <Search
                    api={Api.orders}
                    stubMessage={'Select an action'}
                    type={'none'}
                    search={<OrderSearch query={query} />}
                    detail={detail}
                />
            </div>
        </>
    )
}

type LinkPanelProps = {
    onClose: () => void
    api: string
}

function LinkPanel({ api, onClose }: LinkPanelProps) {
    return (
        <>
            <button
                onClick={onClose}
                style={{
                    backgroundColor: 'transparent',
                    border: 'transparent',
                }}
            >
                <ChevronLeft /> Back
            </button>
            <p className={'small'} style={{ textAlign: 'center' }}>
                <InfoCircle /> Double click on item to link
            </p>
            <TreeViewLink api={api} onCurrentRootChanged={(root) => {}} />
            <SmartScrollContent style={{ flex: 2, paddingLeft: '2rem' }}>
                <div style={{ height: '1em' }}></div>
                {/*{linkPanel && <LinkPanel api={linkPanel}/>}*/}
            </SmartScrollContent>
        </>
    )
}
