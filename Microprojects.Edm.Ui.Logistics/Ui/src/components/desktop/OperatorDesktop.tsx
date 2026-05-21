import { DesktopOrderList } from '@logistics/components/desktop/DesktopOrderList'
import '@logistics/components/desktop' // side-effect: registers the `desktop` namespace
import { OrderRunView } from '@logistics/components/desktop/OrderRunView'
import { Hero, useClock } from '@logistics/components/homepages/Hero'
import type { RootState } from '@logistics/store'
import { displayUserName } from '@microprojects/edm-components/utils'
import { Box } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Route, Routes, useNavigate } from 'react-router-dom'

export const OperatorDesktop = () => {
    const navigate = useNavigate()
    const user = useSelector((s: RootState) => s.user)
    const userShort = displayUserName(user.name)
    const clock = useClock()
    const { t } = useTranslation('desktop')

    return (
        <Box
            sx={{
                flex: 1,
                width: '100%',
                maxWidth: 1400,
                mx: 'auto',
                px: { xs: 2, md: 3 },
                py: { xs: 3, md: 4 },
                fontSize: 16,
            }}
        >
            <Routes>
                <Route
                    index
                    element={
                        <>
                            <Hero
                                userName={userShort}
                                userFull={user.name}
                                role={user.role}
                                clock={clock}
                                lead={t('operator.lead')}
                            />
                            <DesktopOrderList
                                onOpen={(id) => navigate(`/order/${id}`)}
                            />
                        </>
                    }
                />
                <Route path="order/:id" element={<OrderRunView />} />
            </Routes>
        </Box>
    )
}

export default OperatorDesktop
