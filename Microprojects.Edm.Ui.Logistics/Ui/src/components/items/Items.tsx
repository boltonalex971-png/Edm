import Api from '@features/api/api.ts'
import { PageTitle } from '@logistics/components/PageTitle'
import { Search } from '@logistics/components/Search'
import { BatchItemCreate } from '@logistics/components/items/BatchItemCreate.tsx'
import { ItemSearch } from '@logistics/components/items/ItemSearch.tsx'
import type { ItemSearchQuery } from '@logistics/data/types'
import { useRouteMatch } from '@logistics/hooks/routerHooks'
import React, { useEffect, useState } from 'react'
import { NavLink as Link } from 'react-router'
import { useParams } from 'react-router-dom'
import { Nav, NavItem, NavLink } from 'reactstrap'

export function Items() {
    const { path, name } = useRouteMatch()
    const param = useParams()
    const [panel, setPanel] = useState<'search' | 'create'>('search')
    const [linkPanel, setLinkPanel] = useState<string>()
    const [query, setQuery] = useState<ItemSearchQuery>()
    useEffect(() => {
        setQuery({ active: name.includes('remaining') })
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
                    api={Api.items}
                    stubMessage={'Select an action'}
                    type={'none'}
                    search={<ItemSearch query={query} />}
                    detail={<BatchItemCreate />}
                />
            </div>
        </>
    )
}
