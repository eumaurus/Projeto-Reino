import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { AuthProvider } from './features/auth/AuthContext'
import { ToastProvider } from './shared/components/ui/Toast'
import ErrorBoundary from './shared/components/ErrorBoundary'
import RedirectIfAuthed from './features/auth/RedirectIfAuthed'
import { ROLE } from './shared/constants/roles'
import PortalLayout from './features/portal/PortalLayout'

const RouteFallback = () => (
    <div style={{
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--c-gray-400)',
        fontSize: 14,
    }}>
        Carregando…
    </div>
)

// Public
const LandingPage  = lazy(() => import('./features/landing/LandingPage'))
const LoginPage    = lazy(() => import('./features/auth/LoginPage'))
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'))
const NotFoundPage = lazy(() => import('./features/misc/NotFoundPage'))

// Portal shared
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'))

// Client
const ClientDashboard = lazy(() => import('./features/dashboard/ClientDashboard'))
const PetProfilePage  = lazy(() => import('./features/pets/PetProfilePage'))
const MyBookingsPage  = lazy(() => import('./features/bookings/MyBookingsPage'))
const BookingFlowPage = lazy(() => import('./features/bookings/BookingFlowPage'))

// Vet
const VetDashboard        = lazy(() => import('./features/vet/VetDashboard'))
const VetAgendaPage       = lazy(() => import('./features/vet/VetAgendaPage'))
const PatientListPage     = lazy(() => import('./features/vet/PatientListPage'))
const PatientDetailPage   = lazy(() => import('./features/vet/PatientDetailPage'))
const NewConsultationPage = lazy(() => import('./features/vet/NewConsultationPage'))
const ConsultationDetailPage = lazy(() => import('./features/vet/ConsultationDetailPage'))
const PrescriptionDetailPage = lazy(() => import('./features/vet/PrescriptionDetailPage'))
const ExamDetailPage = lazy(() => import('./features/vet/ExamDetailPage'))
const NewPrescriptionPage = lazy(() => import('./features/vet/NewPrescriptionPage'))
const NewExamPage         = lazy(() => import('./features/vet/NewExamPage'))

// Admin
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'))
const ClientsPage    = lazy(() => import('./features/admin/ClientsPage'))
const StaffPage      = lazy(() => import('./features/admin/StaffPage'))
const ServicesPage   = lazy(() => import('./features/admin/ServicesPage'))

// Reception
const ReceptionCheckoutsPage = lazy(() => import('./features/reception/ReceptionCheckoutsPage'))

export default function App() {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <Suspense fallback={<RouteFallback />}>
                            <Routes>
                                <Route path="/"         element={<LandingPage />} />
                                <Route path="/login"    element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
                                <Route path="/register" element={<RedirectIfAuthed><RegisterPage /></RedirectIfAuthed>} />

                                {/* Client + Staff routes */}
                                <Route element={<PortalLayout />}>
                                    <Route path="/profile"            element={<ProfilePage />} />
                                    <Route path="/dashboard"          element={<ClientDashboard />} />
                                    <Route path="/dashboard/pet/:id"  element={<PetProfilePage />} />
                                    <Route path="/bookings"           element={<MyBookingsPage />} />
                                    <Route path="/booking"            element={<BookingFlowPage />} />
                                </Route>

                                {/* Vet + Admin routes */}
                                <Route element={<PortalLayout roles={[ROLE.VET, ROLE.ADMIN]} />}>
                                    <Route path="/vet"                element={<VetDashboard />} />
                                    <Route path="/vet/agenda"         element={<VetAgendaPage />} />
                                    <Route path="/vet/patients"       element={<PatientListPage />} />
                                    <Route path="/vet/patients/:id"   element={<PatientDetailPage />} />
                                    <Route path="/vet/patients/:petId/consultations/new" element={<NewConsultationPage />} />
                                    <Route path="/vet/patients/:petId/consultations/:consultationId" element={<ConsultationDetailPage />} />
                                    <Route path="/vet/patients/:petId/prescriptions/new" element={<NewPrescriptionPage />} />
                                    <Route path="/vet/patients/:petId/prescriptions/:prescriptionId" element={<PrescriptionDetailPage />} />
                                    <Route path="/vet/patients/:petId/exams/new"         element={<NewExamPage />} />
                                    <Route path="/vet/patients/:petId/exams/:examId"     element={<ExamDetailPage />} />
                                </Route>

                                {/* Admin-only routes */}
                                <Route element={<PortalLayout roles={[ROLE.ADMIN]} />}>
                                    <Route path="/admin"           element={<AdminDashboard />} />
                                    <Route path="/admin/clients"   element={<ClientsPage />} />
                                    <Route path="/admin/staff"     element={<StaffPage />} />
                                    <Route path="/admin/services"  element={<ServicesPage />} />
                                </Route>

                                {/* Reception (+ Admin) */}
                                <Route element={<PortalLayout roles={[ROLE.RECEPTION, ROLE.ADMIN]} />}>
                                    <Route path="/reception"            element={<ReceptionCheckoutsPage />} />
                                    <Route path="/reception/checkouts"  element={<ReceptionCheckoutsPage />} />
                                </Route>

                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                        </Suspense>
                    </BrowserRouter>
                </AuthProvider>
            </ToastProvider>
        </ErrorBoundary>
    )
}
