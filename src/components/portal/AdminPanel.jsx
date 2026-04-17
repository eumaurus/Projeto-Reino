import React, { useState, useEffect } from 'react';
import { Users, Search, Trash2, Key, User, PawPrint, Edit, Calendar, Plus, X, ChevronRight, ShieldQuestion, Stethoscope, ClipboardList } from 'lucide-react';
import Button from '../ui/Button';
import Toast from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { getDbUsers, getDbPets, getPetsByOwnerId, deleteUser, updateUserPassword, savePet } from '../../utils/db';
import './AdminPanel.css';

const generatePetCode = () => Math.floor(10000 + Math.random() * 90000).toString();

const VACCINES = {
    Cachorro: [
        { id: 'v8', name: 'Vacina Polivalente V8', info: 'Cobre 7 doenças. Reforço anual.' },
        { id: 'v10', name: 'Vacina Polivalente V10', info: 'V8 + 2 cepas de Leptospirose. Reforço anual.' },
        { id: 'raiva', name: 'Vacina Antirrábica (Raiva)', info: 'Dose única inicial. Reforço anual.' },
        { id: 'gripe_inj', name: 'Vacina contra Tosse / Gripe (Injetável)', info: '2 doses iniciais. Reforço anual.' },
        { id: 'gripe_nasal', name: 'Vacina contra Tosse (Intranasal/Oral)', info: 'Dose única inicial. Reforço anual.' },
        { id: 'giardia', name: 'Vacina contra Giardíase', info: '2 doses iniciais. Reforço anual.' },
        { id: 'leish', name: 'Vacina contra Leishmaniose', info: '3 doses iniciais. Reforço anual.' },
        { id: 'puppy', name: 'Vacina Puppy (Cinomose/Parvo)', info: 'Para filhotes jovens (30-45 dias).' },
        { id: 'lepto', name: 'Vacina contra Leptospirose (Isolada)', info: 'Reforço semestral.' },
        { id: 'lyme', name: 'Vacina contra Doença de Lyme', info: '2 doses iniciais. Reforço anual.' }
    ],
    Gato: [
        { id: 'v3', name: 'Vacina Tríplice Felina - V3', info: 'Panleucopenia/Rino/Calici. Reforço anual.' },
        { id: 'v4', name: 'Vacina Quádrupla Felina - V4', info: 'V3 + Clamidiose. Reforço anual.' },
        { id: 'v5', name: 'Vacina Quíntupla Felina - V5', info: 'V4 + FeLV. Reforço anual.' },
        { id: 'raiva_f', name: 'Vacina Antirrábica Felina', info: 'Dose única inicial. Reforço anual.' },
        { id: 'felv', name: 'Vacina contra FeLV (Isolada)', info: 'Reforço anual.' },
        { id: 'clam', name: 'Vacina contra Clamidiose (Isolada)', info: 'Reforço anual.' },
        { id: 'bord', name: 'Vacina contra Bordetella (Gripe)', info: 'Reforço anual.' },
        { id: 'derm', name: 'Vacina contra Dermatofitose', info: '3 doses iniciais. Reforço anual.' },
        { id: 'pif', name: 'Vacina contra PIF', info: 'Aplicação intranasal. Reforço anual.' },
        { id: 'fiv', name: 'Vacina contra FIV (AIDS Felina)', info: '3 doses iniciais. Reforço anual.' }
    ]
};

const AdminPanel = () => {
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';
    const isVet = currentUser?.role === 'vet';

    const [activeTab, setActiveTab] = useState(isVet ? 'consultation' : (isAdmin ? 'admin' : 'clients'));
    const [users, setUsers] = useState([]);
    const [petCounts, setPetCounts] = useState({});
    const [tutorPets, setTutorPets] = useState([]);
    const [consultationPets, setConsultationPets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState(null);

    // Selected Tutor Tracking (by ID)
    const [selectedTutorId, setSelectedTutorId] = useState(null);

    // Consultation Flow State
    const [consultationTutorId, setConsultationTutorId] = useState(null);
    const [consultationPetId, setConsultationPetId] = useState(null);
    const [consultationForm, setConsultationForm] = useState({
        procedures: '',
        notes: '',
        diagnostic: ''
    });

    // Password Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    // Pet Creation Modal State
    const [isPetModalOpen, setIsPetModalOpen] = useState(false);
    const [petData, setPetData] = useState({ name: '', species: 'Cachorro', breed: '', age: '', weight: '', notes: '' });

    // Pet Edit Modal State
    const [isEditPetModalOpen, setIsEditPetModalOpen] = useState(false);
    const [editingPet, setEditingPet] = useState(null);

    // Vaccine Multi-Select State
    const [isVaccineModalOpen, setIsVaccineModalOpen] = useState(false);
    const [selectedPetForVac, setSelectedPetForVac] = useState(null);
    const [selectedVacIds, setSelectedVacIds] = useState([]);

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (!selectedTutorId) { setTutorPets([]); return; }
        getPetsByOwnerId(selectedTutorId).then(setTutorPets);
    }, [selectedTutorId]);

    useEffect(() => {
        if (!consultationTutorId) { setConsultationPets([]); return; }
        getPetsByOwnerId(consultationTutorId).then(setConsultationPets);
    }, [consultationTutorId]);

    const loadData = async () => {
        const allUsers = await getDbUsers();
        setUsers(allUsers);
        const allPets = await getDbPets();
        const counts = {};
        allPets.forEach(p => { counts[p.ownerId] = (counts[p.ownerId] || 0) + 1; });
        setPetCounts(counts);
    };

    const selectedTutor = users.find(u => u.id === selectedTutorId);

    const handleDeleteUser = async (userId, name) => {
        if (window.confirm(`Tem certeza que deseja excluir o perfil de ${name}? Todos os seus pets também serão removidos.`)) {
            await deleteUser(userId);
            await loadData();
            setNotification({ message: 'Perfil e dependências excluídos com sucesso.', type: 'success' });
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword.length < 4) {
            setNotification({ message: 'A senha deve ter pelo menos 4 caracteres.', type: 'error' });
            return;
        }
        const result = await updateUserPassword(selectedUser.id, newPassword);
        if (result.success) {
            setNotification({ message: `Senha alterada com sucesso.`, type: 'success' });
            setIsPasswordModalOpen(false);
            setNewPassword('');
            setSelectedUser(null);
        } else {
            setNotification({ message: result.message || 'Erro ao alterar senha.', type: 'error' });
        }
    };

    const handleCreatePet = async (e) => {
        e.preventDefault();
        const petCode = generatePetCode();
        const newPet = {
            id: petCode,
            ownerId: selectedTutor.id,
            name: petData.name,
            species: petData.species,
            breed: petData.breed,
            age: petData.age,
            weight: petData.weight,
            notes: petData.notes,
            image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop',
            nextVaccine: 'A definir',
            upcomingAppointments: [],
            vaccines: []
        };
        await savePet(newPet);
        await loadData();
        setNotification({ message: `Pet ${petData.name} criado! Código: ${petCode}`, type: 'success' });
        setIsPetModalOpen(false);
        setPetData({ name: '', species: 'Cachorro', breed: '', age: '', weight: '', notes: '' });
    };

    const handleUpdatePet = async (e) => {
        e.preventDefault();
        await savePet(editingPet);
        await loadData();
        setNotification({ message: `Dados de ${editingPet.name} atualizados com sucesso!`, type: 'success' });
        setIsEditPetModalOpen(false);
        setEditingPet(null);
    };

    const handleDeletePet = async (petId, petName) => {
        if (window.confirm(`Tem certeza que deseja excluir o cadastro de ${petName}? Esta ação não pode ser desfeita.`)) {
            const { error } = await supabase.from('pets').delete().eq('id', petId);
            if (!error) {
                await loadData();
                setNotification({ message: `${petName} removido do sistema.`, type: 'info' });
            }
        }
    };

    const handleAddVaccine = (pet) => {
        setSelectedPetForVac(pet);
        setSelectedVacIds([]);
        setIsVaccineModalOpen(true);
    };

    const confirmVaccines = async () => {
        if (selectedVacIds.length === 0) return;

        const petSpecies = selectedPetForVac.species === 'Gato' ? 'Gato' : 'Cachorro';
        const availableVacs = VACCINES[petSpecies];

        const dateString = new Date().toLocaleDateString('pt-BR');
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        const defaultNextDue = nextYear.toLocaleDateString('pt-BR');

        const newVaccines = selectedVacIds.map(id => {
            const vacTemplate = availableVacs.find(v => v.id === id);
            let nextDue = defaultNextDue;
            if (id === 'lepto') {
                const nextSixMo = new Date();
                nextSixMo.setMonth(nextSixMo.getMonth() + 6);
                nextDue = nextSixMo.toLocaleDateString('pt-BR');
            }
            return {
                name: vacTemplate.name,
                date: dateString,
                nextDue: nextDue,
                vet: currentUser.name,
                status: 'valid'
            };
        });

        const updatedPet = {
            ...selectedPetForVac,
            vaccines: [...newVaccines, ...(selectedPetForVac.vaccines || [])]
        };

        await savePet(updatedPet);
        await loadData();
        setNotification({ message: `${selectedVacIds.length} vacina(s) registrada(s) com sucesso!`, type: 'success' });
        setIsVaccineModalOpen(false);
        setSelectedPetForVac(null);
        setSelectedVacIds([]);
    };

    const clientUsers = users.filter(u => u.role === 'client');

    const filteredUsers = () => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return clientUsers;
        return clientUsers.filter(u =>
            u.name.toLowerCase().includes(term) ||
            (u.document && u.document.replace(/\D/g, '').includes(term.replace(/\D/g, '')))
        );
    };

    const searchResults = filteredUsers();

    // --- Sub-renderers for clarity ---

    const renderTutorDetail = () => {
        if (!selectedTutor) return null;

        return (
            <div className="tutor-detail-view">
                <button className="back-link-btn" onClick={() => setSelectedTutorId(null)}>
                    ← Voltar para lista
                </button>

                <div className="tutor-profile-summary">
                    <div className="tutor-header-info">
                        <div className="tutor-avatar">
                            <User size={32} />
                        </div>
                        <div>
                            <h2>{selectedTutor.name}</h2>
                            <p>CPF/CNPJ: {selectedTutor.document} • {selectedTutor.email}</p>
                        </div>
                    </div>
                    <Button variant="outline" icon={<Plus size={16} />} onClick={() => setIsPetModalOpen(true)}>
                        Novo Animal
                    </Button>
                </div>

                <div className="tutor-pets-section">
                    <h3>Animais Vinculados ({tutorPets.length})</h3>
                    <div className="pet-management-grid">
                        {tutorPets.map(pet => (
                            <div key={pet.id} className="pet-management-card">
                                <div className="pm-card-top">
                                    <div className="pm-pet-img">
                                        <img src={pet.image} alt={pet.name} />
                                    </div>
                                    <div className="pm-pet-info">
                                        <h4>{pet.name} <small>ID: {pet.id}</small></h4>
                                        <p>{pet.species} • {pet.breed}</p>
                                        <p>{pet.age} • {pet.weight || 'Peso não reg.'}</p>
                                    </div>
                                </div>
                                <div className="pm-card-actions">
                                    <button onClick={() => { setEditingPet(pet); setIsEditPetModalOpen(true); }} className="pm-btn edit">
                                        <Edit size={16} /> Ficha Técnica
                                    </button>
                                    <button onClick={() => handleAddVaccine(pet)} className="pm-btn vaccine">
                                        <Calendar size={16} /> Vacinar
                                    </button>
                                    <button onClick={() => handleDeletePet(pet.id, pet.name)} className="pm-btn delete">
                                        <Trash2 size={16} /> Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
                        {tutorPets.length === 0 && (
                            <div className="no-pets-placeholder" onClick={() => setIsPetModalOpen(true)}>
                                <PawPrint size={32} />
                                <p>Este tutor não possui animais cadastrados.</p>
                                <span>Clique aqui para cadastrar</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderAdminTab = () => (
        <div className="admin-section">
            <div className="section-header">
                <h2>Perfis de Acesso</h2>
                <p>Controle de administradores, veterinários e clientes</p>
            </div>
            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Documento</th>
                            <th>Papel</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td><strong>{u.name}</strong><br /><small>{u.email}</small></td>
                                <td>{u.document}</td>
                                <td>
                                    <span className={`badge ${u.role} `}>
                                        {u.role === 'admin' ? 'Administrador' : u.role === 'vet' ? 'Veterinário' : 'Cliente'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="action-btn key" onClick={() => { setSelectedUser(u); setIsPasswordModalOpen(true); }} title="Mudar Senha">
                                            <Key size={16} />
                                        </button>
                                        {u.role === 'client' && (
                                            <button className="action-btn delete" onClick={() => handleDeleteUser(u.id, u.name)} title="Excluir Perfil">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderClientsTab = () => (
        <div className="admin-section">
            <div className="section-header">
                <h2>Lista de Clientes (Tutores)</h2>
                <p>Selecione um tutor para gerenciar seus animais</p>
            </div>
            <div className="search-box">
                <Search size={20} className="search-icon" />
                <input
                    type="text"
                    placeholder="Buscar por Nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="tutor-cards-list">
                {searchResults.map(u => (
                    <div key={u.id} className="tutor-card" onClick={() => setSelectedTutorId(u.id)}>
                        <div className="tutor-card-main">
                            <div className="tutor-card-icon">
                                <User size={20} />
                            </div>
                            <div className="tutor-card-info">
                                <strong>{u.name}</strong>
                                <span>CPF/CNPJ: {u.document}</span>
                            </div>
                        </div>
                        <div className="tutor-card-stats">
                            <span>{petCounts[u.id] || 0} pet(s)</span>
                            <ChevronRight size={18} />
                        </div>
                    </div>
                ))}
                {searchResults.length === 0 && (
                    <div className="no-res-placeholder">
                        <ShieldQuestion size={48} />
                        <p>Nenhum tutor encontrado com este critério.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderConsultationTab = () => {
        // Step 3: Form
        if (consultationPetId) {
            const pet = consultationPets.find(p => p.id === consultationPetId);
            const tutor = users.find(u => u.id === consultationTutorId);

            return (
                <div className="consultation-form-view animate-fade-in visible">
                    <div className="consultation-breadcrumb">
                        <button onClick={() => setConsultationPetId(null)}>← Voltar para Pets</button>
                    </div>

                    <div className="consultation-target-header">
                        <div className="target-info">
                            <Stethoscope size={24} className="icon-main" />
                            <div>
                                <h2>Nova Consulta: {pet?.name}</h2>
                                <p>Tutor: {tutor?.name} • Espécie: {pet?.species}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pro-form-card">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            setNotification({ message: 'Consulta Salva com Sucesso!', type: 'success' });
                            setConsultationTutorId(null);
                            setConsultationPetId(null);
                            setConsultationForm({ procedures: '', notes: '', diagnostic: '' });
                        }}>
                            <div className="pro-form-group">
                                <label>Procedimentos Realizados</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Ex: Vacinação, limpeza de ouvidos, curativo..."
                                    value={consultationForm.procedures}
                                    onChange={e => setConsultationForm({ ...consultationForm, procedures: e.target.value })}
                                />
                            </div>

                            <div className="pro-form-group">
                                <label>Observações Clínicas / Sintomas</label>
                                <textarea
                                    rows="3"
                                    placeholder="Descreva o que foi observado durante a consulta..."
                                    value={consultationForm.notes}
                                    onChange={e => setConsultationForm({ ...consultationForm, notes: e.target.value })}
                                />
                            </div>

                            <div className="pro-form-group">
                                <label>Diagnóstico e Prescrição</label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="Medicamentos, posologia e recomendações..."
                                    value={consultationForm.diagnostic}
                                    onChange={e => setConsultationForm({ ...consultationForm, diagnostic: e.target.value })}
                                />
                            </div>

                            <div className="consultation-form-actions">
                                <Button type="submit" style={{ width: '100%' }}>Finalizar e Salvar Prontuário</Button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        // Step 2: Select Pet
        if (consultationTutorId) {
            const tutor = users.find(u => u.id === consultationTutorId);

            return (
                <div className="consultation-step-view animate-fade-in visible">
                    <div className="consultation-breadcrumb">
                        <button onClick={() => setConsultationTutorId(null)}>← Voltar para Tutores</button>
                    </div>
                    <div className="section-header">
                        <h2>Selecione o Animal</h2>
                        <p>Tutor: <strong>{tutor?.name}</strong></p>
                    </div>

                    <div className="consultation-pet-grid">
                        {consultationPets.map(pet => (
                            <div key={pet.id} className="consultation-selection-card" onClick={() => setConsultationPetId(pet.id)}>
                                <div className="card-img">
                                    <img src={pet.image} alt={pet.name} />
                                </div>
                                <div className="card-info">
                                    <h4>{pet.name}</h4>
                                    <p>{pet.species} • {pet.breed}</p>
                                </div>
                                <ChevronRight size={20} className="arrow" />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Step 1: Search Tutor
        const term = searchTerm.toLowerCase().trim();
        const results = term
            ? clientUsers.filter(u => u.name.toLowerCase().includes(term) || u.document.includes(term))
            : clientUsers;

        return (
            <div className="consultation-step-view animate-fade-in visible">
                <div className="section-header">
                    <h2>Iniciar Consulta</h2>
                    <p>Busque pelo tutor para começar o atendimento</p>
                </div>

                <div className="search-box">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar tutor por nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="tutor-cards-list">
                    {results.map(u => (
                        <div key={u.id} className="tutor-card" onClick={() => setConsultationTutorId(u.id)}>
                            <div className="tutor-card-main">
                                <div className="tutor-card-icon">
                                    <User size={20} />
                                </div>
                                <div className="tutor-card-info">
                                    <strong>{u.name}</strong>
                                    <span>CPF: {u.document}</span>
                                </div>
                            </div>
                            <ChevronRight size={18} />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Main Content Logical Choice
    const renderMainContent = () => {
        if (selectedTutorId) return renderTutorDetail();
        if (activeTab === 'consultation') return renderConsultationTab();
        if (activeTab === 'admin' && isAdmin) return renderAdminTab();
        return renderClientsTab();
    };

    return (
        <div className="admin-panel-container">
            <header className="admin-header">
                <div>
                    <h1>{isAdmin ? 'Portal do Administrador' : 'Painel do Veterinário'}</h1>
                    <p>{isAdmin ? 'Gerenciamento de acessos e consulta de prontuários' : 'Gestão de tutores e animais'}</p>
                </div>
                {!selectedTutorId && (
                    <div className="admin-tabs">
                        {(isAdmin || isVet) && (
                            <button
                                className={`admin-tab ${activeTab === 'consultation' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('consultation');
                                    setSelectedTutorId(null);
                                    setConsultationTutorId(null);
                                    setConsultationPetId(null);
                                }}
                            >
                                <Stethoscope size={18} /> Consultas
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                className={`admin-tab ${activeTab === 'admin' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('admin');
                                    setSelectedTutorId(null);
                                }}
                            >
                                <Users size={18} /> Admin
                            </button>
                        )}
                        <button
                            className={`admin-tab ${activeTab === 'clients' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('clients');
                                setSelectedTutorId(null);
                            }}
                        >
                            <Search size={18} /> {isAdmin ? 'Clientes' : 'Meus Clientes'}
                        </button>
                    </div>
                )}
            </header>

            <main className="admin-content">
                {renderMainContent()}
            </main>

            {/* Modals remain same but use selectedTutorId if needed */}
            {isPetModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content pro-modal">
                        <h3>Cadastrar Animal</h3>
                        <p>Tutor: <strong>{selectedTutor?.name}</strong></p>
                        <form onSubmit={handleCreatePet}>
                            <div className="pro-form-group">
                                <label>Nome do Animal *</label>
                                <input type="text" required value={petData.name} onChange={e => setPetData({ ...petData, name: e.target.value })} />
                            </div>
                            <div className="pro-form-row">
                                <div className="pro-form-group">
                                    <label>Espécie *</label>
                                    <select
                                        required
                                        value={petData.species}
                                        onChange={e => setPetData({ ...petData, species: e.target.value })}
                                        className="pro-select"
                                    >
                                        <option value="Cachorro">Cachorro</option>
                                        <option value="Gato">Gato</option>
                                    </select>
                                </div>
                                <div className="pro-form-group">
                                    <label>Raça *</label>
                                    <input type="text" required value={petData.breed} onChange={e => setPetData({ ...petData, breed: e.target.value })} />
                                </div>
                            </div>
                            <div className="pro-form-row">
                                <div className="pro-form-group">
                                    <label>Idade Estimada</label>
                                    <input type="text" placeholder="Ex: 3 anos" value={petData.age} onChange={e => setPetData({ ...petData, age: e.target.value })} />
                                </div>
                                <div className="pro-form-group">
                                    <label>Peso (kg)</label>
                                    <input type="text" placeholder="Ex: 12kg" value={petData.weight} onChange={e => setPetData({ ...petData, weight: e.target.value })} />
                                </div>
                            </div>
                            <div className="pro-form-group">
                                <label>Observações Clínicas</label>
                                <textarea rows="3" value={petData.notes} onChange={e => setPetData({ ...petData, notes: e.target.value })} placeholder="Alergias, temperamento..." />
                            </div>

                            <div className="modal-actions">
                                <Button type="button" variant="outline" onClick={() => setIsPetModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">Criar e Gerar Código</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditPetModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content pro-modal">
                        <div className="modal-header-with-close">
                            <h3>Ficha Técnica: {editingPet?.name}</h3>
                            <button className="close-modal-btn" onClick={() => setIsEditPetModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdatePet}>
                            <div className="pro-form-row">
                                <div className="pro-form-group">
                                    <label>Raça</label>
                                    <input type="text" value={editingPet?.breed || ''} onChange={e => setEditingPet({ ...editingPet, breed: e.target.value })} />
                                </div>
                                <div className="pro-form-group">
                                    <label>Espécie</label>
                                    <select
                                        value={editingPet?.species || 'Cachorro'}
                                        onChange={e => setEditingPet({ ...editingPet, species: e.target.value })}
                                        className="pro-select"
                                    >
                                        <option value="Cachorro">Cachorro</option>
                                        <option value="Gato">Gato</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pro-form-row">
                                <div className="pro-form-group">
                                    <label>Idade</label>
                                    <input type="text" value={editingPet?.age || ''} onChange={e => setEditingPet({ ...editingPet, age: e.target.value })} />
                                </div>
                                <div className="pro-form-group">
                                    <label>Peso</label>
                                    <input type="text" value={editingPet?.weight || ''} onChange={e => setEditingPet({ ...editingPet, weight: e.target.value })} />
                                </div>
                            </div>
                            <div className="pro-form-group">
                                <label>Observações do Especialista</label>
                                <textarea rows="4" value={editingPet?.notes || ''} onChange={e => setEditingPet({ ...editingPet, notes: e.target.value })} />
                            </div>

                            <div className="vaccine-edit-section">
                                <h4>Carteira de Vacinação</h4>
                                <div className="vac-mini-list">
                                    {editingPet?.vaccines?.map((v, i) => (
                                        <div key={i} className="vac-mini-item">
                                            <span>{v.name} ({v.date})</span>
                                            <button type="button" onClick={() => {
                                                const newVac = editingPet.vaccines.filter((_, idx) => idx !== i);
                                                setEditingPet({ ...editingPet, vaccines: newVac });
                                            }}><Trash2 size={12} /></button>
                                        </div>
                                    ))}
                                    {(!editingPet?.vaccines || editingPet.vaccines.length === 0) && <p>Nenhuma vacina registrada.</p>}
                                </div>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '2rem' }}>
                                <Button type="submit">Salvar Alterações</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPasswordModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Resetar Senha</h3>
                        <p>Alterando senha de <strong>{selectedUser?.name}</strong></p>
                        <form onSubmit={handlePasswordChange}>
                            <input type="password" placeholder="Nova senha" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoFocus />
                            <div className="modal-actions">
                                <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">Salvar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isVaccineModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content pro-modal">
                        <div className="modal-header-with-close">
                            <h3>Registrar Vacinação: {selectedPetForVac?.name}</h3>
                            <button className="close-modal-btn" onClick={() => setIsVaccineModalOpen(false)}><X size={20} /></button>
                        </div>
                        <p>Selecione as vacinas aplicadas hoje. O reforço será calculado automaticamente.</p>

                        <div className="vaccine-selection-list">
                            {VACCINES[selectedPetForVac?.species === 'Gato' ? 'Gato' : 'Cachorro'].map(vac => (
                                <div
                                    key={vac.id}
                                    className={`vaccine-selection-item ${selectedVacIds.includes(vac.id) ? 'selected' : ''}`}
                                    onClick={() => {
                                        if (selectedVacIds.includes(vac.id)) {
                                            setSelectedVacIds(selectedVacIds.filter(id => id !== vac.id));
                                        } else {
                                            setSelectedVacIds([...selectedVacIds, vac.id]);
                                        }
                                    }}
                                >
                                    <div className="vaccine-checkbox"></div>
                                    <div className="vaccine-item-info">
                                        <strong>{vac.name}</strong>
                                        <span>{vac.info}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="modal-actions">
                            <Button variant="outline" onClick={() => setIsVaccineModalOpen(false)}>Cancelar</Button>
                            <Button
                                onClick={confirmVaccines}
                                disabled={selectedVacIds.length === 0}
                            >
                                Confirmar {selectedVacIds.length > 0 ? `(${selectedVacIds.length})` : ''}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        </div>
    );
};

export default AdminPanel;
