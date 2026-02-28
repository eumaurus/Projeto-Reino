import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import { useAuth } from '../../context/AuthContext';

const PortalLayout = () => {
    const { currentUser, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
    }

    if (!currentUser) {
        // Redirect to login but save the attempted url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <div className="app-container" style={{ backgroundColor: 'var(--color-neutral-50)' }}>
            <Navbar />
            <main style={{ paddingTop: '100px', minHeight: '80vh' }}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default PortalLayout;
