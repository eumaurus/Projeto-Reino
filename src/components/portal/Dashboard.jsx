import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, ShieldCheck, User } from 'lucide-react';
import Button from '../ui/Button';
import Toast from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { getPetsByOwnerId, savePet, getPetById } from '../../utils/mockDb';
import './Portal.css';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const isClient = currentUser?.role === 'client';

    const [pets, setPets] = useState(() => {
        if (currentUser && isClient) {
            return getPetsByOwnerId(currentUser.id);
        }
        return [];
    });

    const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [petCodeInput, setPetCodeInput] = useState('');
    const [notification, setNotification] = useState(null);

    const handleAddPetSubmit = (e) => {
        e.preventDefault();
        const code = petCodeInput.trim();
        if (code.length >= 3) {
            const existingPet = getPetById(code);

            if (existingPet) {
                const linkedPet = { ...existingPet, ownerId: currentUser.id };
                savePet(linkedPet);
                setNotification({ message: `Perfil de ${existingPet.name} vinculado com sucesso!`, type: 'success' });
            } else {
                const newPet = {
                    id: code,
                    ownerId: currentUser.id,
                    name: `Pet Vinculado (${code})`,
                    breed: 'Raça Indefinida',
                    species: 'Em atualização...',
                    age: '-',
                    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop',
                    nextVaccine: 'Consultar clínica',
                    upcomingAppointments: [],
                    vaccines: []
                };
                savePet(newPet);
                setNotification({ message: "Novo perfil do pet criado e vinculado com sucesso!", type: 'success' });
            }

            setPets(getPetsByOwnerId(currentUser.id));
            setIsAddPetModalOpen(false);
            setPetCodeInput('');
        } else {
            setNotification({ message: "Código inválido. Por favor, verifique com a recepção.", type: 'error' });
        }
    };

    return (
        <div className="dashboard-container animate-fade-in visible">
            {!isClient ? (
                <div style={{ padding: '4rem 1rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '1.5rem', boxShadow: 'var(--shadow-md)', maxWidth: '600px', margin: '2rem auto' }}>
                    <ShieldCheck size={64} color="var(--color-primary)" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ color: 'var(--color-secondary)', marginBottom: '1rem' }}>Acesso Restrito</h2>
                    <p style={{ color: 'var(--color-neutral-600)', marginBottom: '2rem', lineHeight: '1.6' }}>
                        Esta área é exclusiva para consulta de tutores (clientes). Profissionais devem utilizar os painéis de gestão.
                    </p>
                    <Link to="/admin">
                        <Button>Ir para Painel de Gestão</Button>
                    </Link>
                </div>
            ) : (
                <>
                    <header className="dashboard-header">
                        <div>
                            <h1>Olá, {currentUser?.name}!</h1>
                            <p>Bem-vindo ao Portal do cliente Reino Animal</p>
                        </div>
                        <Button
                            icon={<Plus size={18} />}
                            onClick={() => setIsAddPetModalOpen(true)}
                        >
                            Adicionar
                        </Button>
                    </header>

                    <div className="dashboard-content">
                        <div className="pets-grid">
                            <div className="pets-section-title">
                                <h3>Seus Pets</h3>
                                <span>{pets.length} animal(is) cadastrado(s)</span>
                            </div>

                            <div className="pet-cards">
                                {pets.map(pet => (
                                    <div key={pet.id} className="pet-card">
                                        <div className="pet-card-image">
                                            <img src={pet.image} alt={pet.name} />
                                        </div>
                                        <div className="pet-card-info">
                                            <h3>{pet.name}</h3>
                                            <p>{pet.breed} • {pet.age}</p>
                                            <Link to={`/dashboard/pet/${pet.id}`} className="view-profile-btn">
                                                Ver Carteirinha <ShieldCheck size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                ))}

                                {pets.length === 0 && (
                                    <div className="empty-pets" onClick={() => setIsAddPetModalOpen(true)}>
                                        <Plus size={24} />
                                        <p>Vincular novo pet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="dashboard-sidebar">
                            <div className="sidebar-card user-card">
                                <div className="user-card-header">
                                    <User size={20} />
                                    <h3>Meus Dados</h3>
                                </div>
                                <div className="user-card-content">
                                    <div className="user-info-item">
                                        <span>Nome:</span>
                                        <strong>{currentUser?.name}</strong>
                                    </div>
                                    <div className="user-info-item">
                                        <span>Email:</span>
                                        <strong>{currentUser?.email}</strong>
                                    </div>
                                    <div className="user-info-item">
                                        <span>Telefone:</span>
                                        <strong>{currentUser?.phone}</strong>
                                    </div>
                                    <button className="edit-btn" onClick={() => setIsSettingsModalOpen(true)}>Consultar ou Alterar Dados</button>
                                </div>
                            </div>

                            <div className="sidebar-card reminder-card">
                                <div className="sidebar-card-header">
                                    <Calendar size={20} />
                                    <h3>Próximos Compromissos</h3>
                                </div>
                                <div className="sidebar-card-content">
                                    <p className="no-reminders">Nenhum agendamento para esta semana.</p>
                                    <Link to="/booking">
                                        <Button variant="outline" style={{ width: '100%' }}>Agendar Novo</Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {isAddPetModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
                    <div className="modal-content" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1.5rem', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)' }}>
                        <h3 style={{ color: 'var(--color-secondary)', marginBottom: '1rem', fontSize: '1.25rem' }}>Vincular Pet à Conta</h3>
                        <p style={{ color: 'var(--color-neutral-700)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Por favor, insira o Código de Perfil do pet fornecido pelo veterinário ou pela recepção ao final do atendimento.
                        </p>
                        <form onSubmit={handleAddPetSubmit}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Código do Perfil</label>
                                <input
                                    type="text"
                                    required
                                    value={petCodeInput}
                                    onChange={(e) => setPetCodeInput(e.target.value)}
                                    placeholder="Ex: 12345"
                                    style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid var(--color-neutral-200)', borderRadius: '0.75rem', fontFamily: 'inherit' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Button variant="outline" type="button" onClick={() => setIsAddPetModalOpen(false)} style={{ flex: 1 }}>
                                    Cancelar
                                </Button>
                                <Button type="submit" style={{ flex: 1 }}>
                                    Vincular
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isSettingsModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
                    <div className="modal-content" style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '1.5rem', width: '100%', maxWidth: '450px', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(115, 198, 232, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <User size={32} color="var(--color-primary-dark)" />
                        </div>
                        <h3 style={{ color: 'var(--color-secondary)', marginBottom: '1rem', fontSize: '1.35rem' }}>Editar Perfil</h3>
                        <p style={{ color: 'var(--color-neutral-700)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                            Para garantir a segurança dos dados, alterações cadastrais (nome, e-mail, telefone) devem ser solicitadas diretamente na recepção da clínica ou via WhatsApp.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <a href="https://wa.me/5511992352313" target="_blank" rel="noopener noreferrer" style={{ width: '100%' }}>
                                <Button style={{ width: '100%' }}>Solicitar Alteração</Button>
                            </a>
                            <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)} style={{ width: '100%' }}>
                                Entendi
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;
