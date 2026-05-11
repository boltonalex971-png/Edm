import { DesktopOrderList } from '@logistics/components/desktop/DesktopOrderList'
import { OrderRunView } from '@logistics/components/desktop/OrderRunView'
import { Box } from '@mui/material'
import { Route, Routes, useNavigate } from 'react-router-dom'

export const OperatorDesktop = () => {
    const navigate = useNavigate()

    return (
        <Box
            sx={{
                flex: 1,
                width: '100%',
                maxWidth: 1400,
                mx: 'auto',
                px: 0,
                py: 1.25,
                fontSize: 16,
            }}
        >
            <Routes>
                <Route
                    index
                    element={
                        <DesktopOrderList
                            onOpen={(id) => navigate(`/desktop/order/${id}`)}
                        />
                    }
                />
                <Route path="order/:id" element={<OrderRunView />} />
            </Routes>
        </Box>
    )
}

export default OperatorDesktop
