import Api from '@features/api/api.ts'
import { PageTitle } from '@logistics/components/PageTitle'
import { OrderDetail } from '@logistics/components/orders/OrderDetail'
import { OrderSearch } from '@logistics/components/orders/OrderSearch.tsx'
import type { OrderSearchQuery, UUID } from '@logistics/data/types'
import { useRouteMatch } from '@logistics/hooks/routerHooks'
import { Search } from '@microprojects/edm-components/components/page/Search'
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { NavLink as Link } from 'react-router'
import { Nav, NavItem, NavLink } from 'reactstrap'

export function Orders() {
    const { path, name } = useRouteMatch()
    const [query, setQuery] = useState<OrderSearchQuery>()
    // After a successful Create, flip the Create-panel from the empty
    // "New Order" form to a view-mode detail of the just-created order.
    // Cleared via the detail's Close button so the user can create another.
    const [createdOrderId, setCreatedOrderId] = useState<UUID>()
    useEffect(() => {
        setQuery({ active: name.includes('ongoing') })
    }, [name])

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
                    actions={[
                        {
                            key: 'search',
                            label: 'Search',
                            icon: <SearchIcon fontSize="small" />,
                            panel: <OrderSearch query={query} />,
                        },
                        {
                            key: 'create',
                            label: 'Create new',
                            icon: <AddIcon fontSize="small" />,
                            panel: detail,
                        },
                    ]}
                />
            </div>
        </>
    )
}
