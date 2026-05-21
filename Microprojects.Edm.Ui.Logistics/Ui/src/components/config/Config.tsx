import { Nomenclatures } from '@logistics/components/config/nomenclature/Nomenclatures.tsx'
import { TareTypes } from '@logistics/components/config/taretype/TareTypes.tsx'
import {
    MANUFACTURING,
    OPERATION,
    TECHNOLOGY,
} from '@logistics/data/processKinds'
import { SubRootPage } from '@microprojects/edm-components/components/chrome/SubRootPage'
import { useBasePath } from '@microprojects/edm-components/hooks/useBasePath'
import {
    AccountTreeOutlined as ManufacturingIcon,
    AllInboxOutlined as TareTypesIcon,
    CategoryOutlined as NomenclaturesIcon,
    PlayArrowOutlined as OperationsIcon,
    PrecisionManufacturingOutlined as TechnologyIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { Route, Routes } from 'react-router-dom'
import { Processes } from './process/Processes'
import './index' // side-effect: registers the `config` namespace

export function Config() {
    const path = useBasePath()
    const { t } = useTranslation('config')

    const menuItems = [
        { label: t('menu.manufacturing'), path: `${path}/manufacturing`, icon: <ManufacturingIcon fontSize="small" /> },
        { label: t('menu.technology'), path: `${path}/technology`, icon: <TechnologyIcon fontSize="small" /> },
        { label: t('menu.operations'), path: `${path}/operations`, icon: <OperationsIcon fontSize="small" /> },
        { label: t('menu.nomenclatures'), path: `${path}/nomenclatures`, icon: <NomenclaturesIcon fontSize="small" /> },
        { label: t('menu.tareTypes'), path: `${path}/taretypes`, icon: <TareTypesIcon fontSize="small" /> },
    ]

    return (
        <SubRootPage title={t('title')} menuItems={menuItems}>
            <Routes>
                <Route index element={<p>{t('selectOption')}</p>} />
                <Route path="manufacturing/*" element={<Processes kind={MANUFACTURING} />} />
                <Route path="technology/*" element={<Processes kind={TECHNOLOGY} />} />
                <Route path="operations/*" element={<Processes kind={OPERATION} />} />
                <Route path="nomenclatures/*" element={<Nomenclatures />} />
                <Route path="taretypes/*" element={<TareTypes />} />
                <Route path="*" element={<span>{t('pageNotExists')}</span>} />
            </Routes>
        </SubRootPage>
    )
}
