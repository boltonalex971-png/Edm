import Api from '@features/api/api.ts'
import { OrderDetail } from '@logistics/components/orders/OrderDetail'
import { OrderSearch } from '@logistics/components/orders/OrderSearch.tsx'
import type { OrderSearchQuery, UUID } from '@logistics/data/types'
import { useRouteMatch } from '@logistics/hooks/routerHooks'
import { SubRootPage } from '@microprojects/edm-components/components/chrome/SubRootPage'
import { useBasePath } from '@microprojects/edm-components/hooks/useBasePath'
import { Search } from '@microprojects/edm-components/components/page/Search'
import {
    Add as AddIcon,
    CheckCircleOutlined as CompletedIcon,
    PendingActionsOutlined as ActiveIcon,
    Search as SearchIcon,
} from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function Orders() {
    const { name } = useRouteMatch()
    const path = useBasePath()
    const navigate = useNavigate()
    const [query, setQuery] = useState<OrderSearchQuery>()
    // After a successful Create, flip the Create-panel from the empty
    // "New Order" form to a view-mode detail of the just-created order.
    // Cleared via the detail's Close button so the user can create another.
    const [createdOrderId, setCreatedOrderId] = useState<UUID>()

    // The header "Orders" link points at the bare /orders path. Land there
    // → bounce to /orders/ongoing so the Active sub-tab is the default and
    // the SubRootPage tab strip highlights it. `replace` so back doesn't
    // ping-pong between /orders and /orders/ongoing.
    useEffect(() => {
        if (name === '' || name === '/') {
            navigate(`${path}/ongoing`, { replace: true })
        }
    }, [name, path, navigate])

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

    const menuItems = [
        { label: 'Active', path: `${path}/ongoing`, icon: <ActiveIcon fontSize="small" /> },
        { label: 'Completed', path: `${path}/completed`, icon: <CompletedIcon fontSize="small" /> },
    ]

    return (
        <SubRootPage title="Orders" menuItems={menuItems}>
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
        </SubRootPage>
    )
}
