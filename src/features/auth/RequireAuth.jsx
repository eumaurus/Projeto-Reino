import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { homeForRole } from '../../shared/constants/roles'

export default function RequireAuth({ roles, children }) {
    const { currentUser, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) {
        return (
            <div style={{
                minHeight: '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--c-gray-500)',
                fontSize: 'var(--fs-sm)',
            }}>
                Carregando…
            </div>
        )
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />
    }

    if (roles && !roles.includes(currentUser.role)) {
        return <Navigate to={homeForRole(currentUser.role)} replace />
    }

    return children
}
