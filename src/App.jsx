import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Structure from './components/sections/Structure';
import Services from './components/sections/Services';
import Team from './components/sections/Team';
import Booking from './components/sections/Booking';

// Portal Components
import Login from './components/portal/Login';
import Register from './components/portal/Register';
import PortalLayout from './components/portal/PortalLayout';
import Dashboard from './components/portal/Dashboard';
import PetProfile from './components/portal/PetProfile';
import InternalBooking from './components/portal/InternalBooking';
import AdminPanel from './components/portal/AdminPanel';

import { AuthProvider } from './context/AuthContext';

const HomePage = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.animate-fade-in');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="app-container">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Structure />
        <Services />
        <Team />
        <Booking />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Portal Routes */}
          <Route element={<PortalLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/pet/:id" element={<PetProfile />} />
            <Route path="/booking" element={<InternalBooking />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
