import './App.css';
import React, { useEffect } from "react";
import {Link, Route, Routes} from "react-router-dom";
import {Layout} from "./components/Layout";
import {Processes} from "./components/config/process/Processes";
import {Home} from "@logistics/components/homepages/Home.tsx";
import {Config} from "@logistics/components/config/Config.tsx";
import {Orders} from "@logistics/components/orders/Orders.tsx";
import {Supplies} from "@logistics/components/supplies/Supplies.tsx";
import {Warehouse} from "@logistics/components/warehouse/Warehouse.tsx";
import {Items} from "@logistics/components/items/Items.tsx";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@logistics/store.ts";
import {getUserFromToken} from "./features/auth/authUtils";
import {setUser} from "./features/auth/userSlice";

export function App() {
    const user = useSelector((state : RootState) => state.user)
    const userDispatch = useDispatch()

    useEffect(() => {
        const u = getUserFromToken();
        if (u) {
            userDispatch(setUser(u));
        }
    }, [userDispatch]);

    const isAuthenticated = user.name !== 'Guest';
    const hasRole = !!user.role && user.role !== 'Guest';

    return (
        <Layout>
            {hasRole &&
                    <Routes>
                        <Route index element={<Home />} />
                        <Route path='/config/*' element={<Config />} />
                        <Route path='/orders/*' element={<Orders />} />
                        <Route path='/items/*' element={<Items />} />
                        <Route path='/warehouse/*' element={<Warehouse />} />
                        <Route path='*' element={<span>Page not exist</span>} />
                    </Routes>
            }
            {isAuthenticated && !hasRole &&
                <span>
                    As user {user.name} you are not authorized to access ISTP application.
                    No role is assigned to your account.
                    Please refer to your system administrator.
                </span>
            }
            {!isAuthenticated &&
                <span>
                    You are not authenticated to access ISTP application.
                    Please refer to your system administrator.
                </span>
            }
        </Layout>
    );
}


export default App 
