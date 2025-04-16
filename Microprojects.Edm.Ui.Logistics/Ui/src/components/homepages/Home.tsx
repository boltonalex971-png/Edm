import {Link} from "react-router-dom";

export const Home = () => {
    return (
        <div style={{width: '100%', height: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div>
                <h3>This is a logistics home page</h3>
                <p>There should a few different home pages for every role.</p>
                <p>
                    Examples:
                </p>
                <ul>
                    <li><Link to={'/'}>Guest</Link></li>
                    <li><Link to={'/'}>Operator</Link></li>
                    <li><Link to={'/'}>Technologist</Link></li>
                    <li><Link to={'/'}>Administrator</Link></li>
                </ul>
            </div>
        </div>
    )
}