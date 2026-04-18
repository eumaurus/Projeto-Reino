import { Outlet } from 'react-router-dom'
import Navbar from '../../shared/components/layout/Navbar'
import RequireAuth from '../auth/RequireAuth'
import './portal.css'

export default function PortalLayout({ roles }) {
    return (
        <RequireAuth roles={roles}>
            <div className="portal-shell">
                <Navbar variant="portal" />
                <main className="portal-main">
                    <div className="container" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </RequireAuth>
    )
}
