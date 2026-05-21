import './index' // side-effect: registers the `items` namespace
import { BatchItemCreate } from '@logistics/components/items/BatchItemCreate.tsx'
import { ItemSearch } from '@logistics/components/items/ItemSearch.tsx'
import type { ItemSearchQuery } from '@logistics/data/types'
import { useRouteMatch } from '@logistics/hooks/routerHooks'
import { SubRootPage } from '@microprojects/edm-components/components/chrome/SubRootPage'
import { useBasePath } from '@microprojects/edm-components/hooks/useBasePath'
import { Search } from '@microprojects/edm-components/components/page/Search'
import {
    Add as AddIcon,
    CheckCircleOutlined as ConsumedIcon,
    Inventory2Outlined as AvailableIcon,
    Search as SearchIcon,
} from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export function Items() {
    const { t } = useTranslation('items')
    const { name } = useRouteMatch()
    const path = useBasePath()
    const navigate = useNavigate()
    const [query, setQuery] = useState<ItemSearchQuery>()

    // Header "Items" link points at bare /items. Land there → bounce to
    // /items/remaining so Available is the default and the tab strip
    // highlights it. `replace` so back doesn't ping-pong.
    useEffect(() => {
        if (name === '' || name === '/') {
            navigate(`${path}/remaining`, { replace: true })
        }
    }, [name, path, navigate])

    useEffect(() => {
        setQuery({ active: name.includes('remaining') })
    }, [name])

    const menuItems = [
        { label: t('tabs.available', 'Available'), path: `${path}/remaining`, icon: <AvailableIcon fontSize="small" /> },
        { label: t('tabs.consumed', 'Consumed'), path: `${path}/consumed`, icon: <ConsumedIcon fontSize="small" /> },
    ]

    return (
        <SubRootPage title={t('titlePlural', 'Items')} menuItems={menuItems}>
            <Search
                actions={[
                    {
                        key: 'search',
                        label: t('tabs.search', 'Search'),
                        icon: <SearchIcon fontSize="small" />,
                        panel: <ItemSearch query={query} />,
                    },
                    {
                        key: 'create',
                        label: t('tabs.createNew', 'Create new'),
                        icon: <AddIcon fontSize="small" />,
                        panel: <BatchItemCreate />,
                    },
                ]}
            />
        </SubRootPage>
    )
}
