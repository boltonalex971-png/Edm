import Api from '@features/api/api.ts'
import { PageTitle } from '@logistics/components/PageTitle'
import { Search } from '@logistics/components/Search'
import { TreeViewLink } from '@logistics/components/TreeViewLink'
import { OrderDetail } from '@logistics/components/orders/OrderDetail'
import { OrderSearch } from '@logistics/components/orders/OrderSearch.tsx'
import type { OrderSearchQuery } from '@logistics/data/types'
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
                    detail={
                        <OrderDetail
                            title="New Order"
                            editMode={true}
                            api={Api.orders}
                        />
                    }
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
