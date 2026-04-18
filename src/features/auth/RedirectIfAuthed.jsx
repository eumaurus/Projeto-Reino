import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { homeForRole } from '../../shared/constants/roles'

export default function RedirectIfAuthed({ children }) {
    const { currentUser, isLoading } = useAuth()
    if (isLoading) return null
    if (currentUser) return <Navigate to={homeForRole(currentUser.role)} replace />
    return children
}
