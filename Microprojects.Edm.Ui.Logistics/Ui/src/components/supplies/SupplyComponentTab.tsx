import Api from '@features/api/api'
import { BatchItemCreate } from '@logistics/components/items/BatchItemCreate'
import { ItemDetail } from '@logistics/components/items/ItemDetail'
import '@logistics/components/supplies' // side-effect: registers the `supplies` namespace
import { TareDetail } from '@logistics/components/tare/TareDetail'
import { TareItemsPanel } from '@logistics/components/tare/TareItemsPanel'
import type { UUID } from '@logistics/data/types'
import { AddOutlined as AddIcon } from '@mui/icons-material'
import { Box, Button as MuiButton } from '@mui/material'
import { useTranslation } from 'react-i18next'

type SupplyComponentTabProps = {
    id: UUID
    api: string
    onDetailSelected?: Function
}

export function SupplyComponentTab({
    id,
    api,
    onDetailSelected,
}: SupplyComponentTabProps) {
    const { t } = useTranslation('supplies')
    return (
        <TareItemsPanel
            api={`${api}/${id}/items`}
            supplyId={id}
            toolbar={
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <MuiButton
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                            onDetailSelected?.(
                                <BatchItemCreate
                                    supplyId={id}
                                    onClose={() =>
                                        onDetailSelected?.(undefined)
                                    }
                                />,
                            )
                        }
                        sx={{
                            marginBottom: '0.5rem'
                        }}
                    >
                        {t('actions.addItems')}
                    </MuiButton>
                </Box>
            }
            onTareClick={(group) => {
                onDetailSelected?.(
                    <TareDetail
                        tareId={group.tare.id}
                        tare={group.tare}
                        items={group.items}
                        label={group.tare.barcode}
                        onClose={() => onDetailSelected?.(undefined)}
                    />,
                )
            }}
            onItemClick={(item) => {
                onDetailSelected?.(
                    <ItemDetail
                        readonly={true}
                        id={item.id}
                        api={Api.items}
                        type="item"
                        onClose={() => onDetailSelected?.(undefined)}
                    />,
                )
            }}
        />
    )
}
