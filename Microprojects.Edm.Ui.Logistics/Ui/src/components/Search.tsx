import Api from '@features/api/api.ts'
import {
    Detail,
    type DetailProps,
    EMPTY_GUID,
} from '@logistics/components/MasterDetail.tsx'
import { useGet } from '@logistics/hooks/hooks.ts'
import { SmartScroll, SmartScrollContent } from '@microprojects/tools'
import {
    Button,
    ButtonGroup,
    type ButtonProps,
    Toolbar,
    ToolbarItem,
} from '@progress/kendo-react-buttons'
import axios from 'axios'
import type React from 'react'
import { type EffectCallback, type ReactElement, useEffect } from 'react'
import { type MouseEventHandler, useState } from 'react'
import {
    Diagram3,
    Download,
    Pen,
    Search as SearchIcon,
} from 'react-bootstrap-icons'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import type {
    DataItem,
    DetailEventHandler,
    Dictionary,
    Item,
    Process,
    TreeDataItem,
} from '../data/types'
import { useBasePath, useRouteMatch } from '../hooks/routerHooks'
import type { TreeItemProps } from './TreeViewMaster'

export type SearchProps = {
    api: string
    item?: (props: TreeItemProps) => React.ReactElement
    stubMessage: string
    type: string
    detail: ReactElement
    search: ReactElement
    path: string
}

export function Search(props: SearchProps) {
    const { path } = useRouteMatch()
    const [panel, setPanel] = useState<'search' | 'create'>('search')
    const searchClick = (e) => {
        setPanel('search')
    }
    const createClick = (e) => {
        setPanel('create')
    }

    return (
        <SmartScroll
            offsetTop={10}
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 20,
            }}
        >
            <SmartScrollContent
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '1rem',
                }}
            >
                <div style={{ height: '1em' }}></div>
                <Button type={'button'} fillMode={'flat'} onClick={searchClick}>
                    <SearchIcon /> Search
                </Button>
                <Button type={'button'} fillMode={'flat'} onClick={createClick}>
                    <Pen /> Create new
                </Button>
                <Button fillMode={'flat'}>
                    <Download /> Get from accounting system
                </Button>
            </SmartScrollContent>
            <SmartScrollContent style={{ flex: 5, marginLeft: '1rem' }}>
                {panel == 'create' && props.detail}
                {panel == 'search' && props.search}
                <div style={{ height: '40vh' }}>
                    {/*div to avoid ui jerking when switching cards at bottom*/}
                </div>
            </SmartScrollContent>
        </SmartScroll>
    )
}

export interface SearchDetailProps extends DetailProps {
    onChange?: DetailEventHandler
    onUpdate?: DetailEventHandler
    onClose: () => void
    path: string
    api: string
    processId?: number
    type: string
    searchPanel: React.ReactNode
}

export function SearchDetail({ processId, ...props }: SearchDetailProps) {
    const params = useParams<{ id: string }>()
    const id = processId?.toString() || params.id
    const [sub, setSub] = useState<React.ReactElement>()
    useEffect(setSub as EffectCallback, [id])
    const [[kinds]] = useGet<string[]>(`${Api.processes}/kinds`, [])
    const [[noms]] = useGet<Item[]>(`${Api.nomenclatures}`, [])
    let [[data, setData], loading, error] = useGet<Process>(
        `${props.api}/${id}`,
        [id],
    )
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as Process
    }

    const missedInputs = JSON.parse(data.message || '[]')
    return (
        <Detail
            api={props.api}
            path={props.path}
            onChange={props.onChange}
            onClose={props.onClose}
            id={id}
            icon={<Diagram3 title="Process" />}
            loading={loading}
            error={error as string}
            validation={
                missedInputs.length > 0
                    ? `Parameter${missedInputs.length > 1 ? 's' : ''} ${missedInputs.join(', ')} ${missedInputs.length > 1 ? 'are' : 'is'} not available as output parameters`
                    : ''
            }
            data={data}
            subDetail={sub}
            card={props.searchPanel({ onDetailSelected: setSub })}
        />
    )
}
