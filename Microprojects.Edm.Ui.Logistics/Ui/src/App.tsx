import './App.css';
import {Link, Route, Routes} from "react-router-dom";
import {Layout} from "./components/Layout";
import {useGetUserQuery} from "./features/api/apiSlice";
import {Processes} from "./components/config/process/Processes";
import {Home} from "@logistics/components/homepages/Home.tsx";
import {Config} from "@logistics/components/config/Config.tsx";
import {Orders} from "@logistics/components/orders/Orders.tsx";
import {Supplies} from "@logistics/components/supplies/Supplies.tsx";
import {Warehouse} from "@logistics/components/warehouse/Warehouse.tsx";
import {Items} from "@logistics/components/items/Items.tsx";

export function App() {
    const {data: user, error, isLoading} = useGetUserQuery();
    // const _ = useGet(`${api.auth}/user/name`, [], (u) => {
    //     userDispatch(setUser(u))
    // })

    return (
        <Layout>
            {user?.role &&
                    <Routes>
                        <Route index element={<Home />} />
                        <Route path='/config/*' element={<Config />} />
                        <Route path='/orders/*' element={<Orders />} />
                        <Route path='/items/*' element={<Items />} />
                        <Route path='/warehouse/*' element={<Warehouse />} />
                        <Route path='*' element={<span>Page not exist</span>} />
                    </Routes>
            }
            {user && !user.role &&
                <span>
                    As user {user.name} you are not authorized to access ISTP application.
                    No role is assigned to your account.
                    Please refer to your system administrator.
                </span>
            }
            {!user &&
                <span>
                    You are not authenticated to access ISTP application.
                    Please refer to your system administrator.
                </span>
            }
        </Layout>
    );
}


export default App 
