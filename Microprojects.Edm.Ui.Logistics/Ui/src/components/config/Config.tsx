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
    AccountTreeOutlined as TechnologyIcon,
    CategoryOutlined as NomenclaturesIcon,
    PrecisionManufacturingOutlined as ManufacturingIcon,
    AllInboxOutlined as TareTypesIcon,
    PlayArrowOutlined as OperationsIcon,
} from '@mui/icons-material'
import { Route, Routes } from 'react-router-dom'
import { Processes } from './process/Processes'

export function Config() {
    const path = useBasePath()

    const menuItems = [
        { label: 'Manufacturing', path: `${path}/manufacturing`, icon: <ManufacturingIcon fontSize="small" /> },
        { label: 'Technology', path: `${path}/technology`, icon: <TechnologyIcon fontSize="small" /> },
        { label: 'Operations', path: `${path}/operations`, icon: <OperationsIcon fontSize="small" /> },
        { label: 'Nomenclatures', path: `${path}/nomenclatures`, icon: <NomenclaturesIcon fontSize="small" /> },
        { label: 'Tare types', path: `${path}/taretypes`, icon: <TareTypesIcon fontSize="small" /> },
    ]

    return (
        <SubRootPage title="Configurations" menuItems={menuItems}>
            <Routes>
                <Route index element={<p>Select one of the options above</p>} />
                <Route path="manufacturing/*" element={<Processes kind={MANUFACTURING} />} />
                <Route path="technology/*" element={<Processes kind={TECHNOLOGY} />} />
                <Route path="operations/*" element={<Processes kind={OPERATION} />} />
                <Route path="nomenclatures/*" element={<Nomenclatures />} />
                <Route path="taretypes/*" element={<TareTypes />} />
                <Route path="*" element={<span>Page not exists</span>} />
            </Routes>
        </SubRootPage>
    )
}
