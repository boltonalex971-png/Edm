import { DesktopOrderList } from '@logistics/components/desktop/DesktopOrderList'
import { OrderRunView } from '@logistics/components/desktop/OrderRunView'
import styles from '@logistics/components/desktop/desktop.module.css'
import { Route, Routes, useNavigate } from 'react-router-dom'

export const OperatorDesktop = () => {
    const navigate = useNavigate()

    return (
        <div className={styles.content}>
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
        </div>
    )
}

export default OperatorDesktop
