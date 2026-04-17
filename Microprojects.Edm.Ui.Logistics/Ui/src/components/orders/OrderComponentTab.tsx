import React from 'react'
import type {UUID} from '@logistics/data/types'
import {TareItemsPanel} from '@logistics/components/tare/TareItemsPanel'
import {TareDetail} from '@logistics/components/tare/TareDetail'
import {ItemDetail} from '@logistics/components/items/ItemDetail'
import Api from '@features/api/api'

type OrderComponentTabProps = {
    id: UUID
    api: string
    onDetailSelected?: Function
}

export function OrderComponentTab({id, api, onDetailSelected}: OrderComponentTabProps) {
    return (
        <TareItemsPanel
            api={`${api}/${id}/items`}
            onTareClick={(group) => {
                onDetailSelected?.(
                    <TareDetail
                        tareId={group.tare.id}
                        label={group.tare.barcode}
                        onClose={() => onDetailSelected?.(undefined)}
                    />
                )
            }}
            onItemClick={(item) => {
                onDetailSelected?.(
                    <ItemDetail
                        readonly={true}
                        id={item.id}
                        api={Api.items}
                        onClose={() => onDetailSelected?.(undefined)}
                    />
                )
            }}
        />
    )
}

