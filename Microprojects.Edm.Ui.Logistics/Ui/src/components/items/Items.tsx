import { PageTitle } from '@logistics/components/PageTitle'
import { BatchItemCreate } from '@logistics/components/items/BatchItemCreate.tsx'
import { ItemSearch } from '@logistics/components/items/ItemSearch.tsx'
import type { ItemSearchQuery } from '@logistics/data/types'
import { useRouteMatch } from '@logistics/hooks/routerHooks'
import { Search } from '@microprojects/edm-components/components/page/Search'
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { NavLink as Link } from 'react-router'
import { Nav, NavItem, NavLink } from 'reactstrap'

export function Items() {
    const { path, name } = useRouteMatch()
    const [query, setQuery] = useState<ItemSearchQuery>()
    useEffect(() => {
        setQuery({ active: name.includes('remaining') })
    }, [name])

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <PageTitle title="Items" />
                <Nav pills>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/remaining`}>
                            Available
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/consumed`}>
                            Consumed
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
                            panel: <ItemSearch query={query} />,
                        },
                        {
                            key: 'create',
                            label: 'Create new',
                            icon: <AddIcon fontSize="small" />,
                            panel: <BatchItemCreate />,
                        },
                    ]}
                />
            </div>
        </>
    )
}
