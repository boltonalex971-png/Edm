import './App.css';
import {Link, Route, Routes} from "react-router-dom";
import {Layout} from "./components/Layout";
import {useGetUserQuery} from "./features/api/apiSlice";
import {Processes} from "./components/config/process/Processes";

export function App() {
    const {data: user, error, isLoading} = useGetUserQuery();
    // const _ = useGet(`${api.auth}/user/name`, [], (u) => {
    //     userDispatch(setUser(u))
    // })

    return (
        <Layout>
            {user?.role &&
                    <Routes>
                        <Route index element={<Link to={'/processes'}>Processes</Link>} />
                        <Route path='/processes/*' element={<Processes/>} />
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
