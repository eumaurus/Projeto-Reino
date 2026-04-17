import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Syringe, FileText, Weight } from 'lucide-react';
import { getPetById, savePet } from '../../utils/db';
import Button from '../ui/Button';
import './Portal.css';

const PetProfile = () => {
    const { id } = useParams();
    const [pet, setPet] = useState(null);

    useEffect(() => {
        getPetById(id).then(setPet);
    }, [id]);

    // Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editImage, setEditImage] = useState('');

    useEffect(() => {
        if (pet) {
            setEditName(pet.name);
            setEditImage(pet.image);
        }
    }, [pet]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const updatedPet = { ...pet, name: editName, image: editImage };
        await savePet(updatedPet);
        setPet(updatedPet);
        setIsEditModalOpen(false);
    };

    if (!pet) {
        return <div style={{ padding: '5rem', textAlign: 'center' }}>Pet não encontrado ou carregando...</div>;
    }

    const vaccines = pet.vaccines || [];

    return (
        <div className="portal-page">
            <div className="container" style={{ maxWidth: '900px' }}>
                <Link to="/dashboard" className="back-btn">
                    <ArrowLeft size={18} /> Voltar para Dashboard
                </Link>

                <div className="pet-profile-card">
                    <div className="pet-profile-header">
                        <img src={pet.image} alt={pet.name} className="pet-profile-img" />
                        <div className="pet-profile-title">
                            <h1>{pet.name} <span style={{ fontSize: '0.9rem', color: 'var(--color-neutral-600)', fontWeight: 'normal' }}>({pet.id})</span></h1>
                            <p>{pet.species} • {pet.breed} • {pet.age}</p>
                        </div>
                        <Button className="edit-pet-btn" variant="outline" onClick={() => setIsEditModalOpen(true)}>
                            Editar Perfil
                        </Button>
                    </div>

                    <div className="pet-stats-grid">
                        <div className="pet-stat">
                            <Weight size={20} className="stat-icon" />
                            <div>
                                <span>Peso Atual</span>
                                <strong>24.5 kg</strong>
                            </div>
                        </div>
                        <div className="pet-stat">
                            <Syringe size={20} className="stat-icon" />
                            <div>
                                <span>Próxima Vacina</span>
                                <strong>{pet.nextVaccine}</strong>
                            </div>
                        </div>
                        <div className="pet-stat">
                            <FileText size={20} className="stat-icon" />
                            <div>
                                <span>Última Consulta</span>
                                <strong>10/02/2026</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="vaccine-card-section">
                    <div className="section-header-flex">
                        <h2>Carteirinha de Vacinação Virtual</h2>
                        <Link to="/booking">
                            <Button size="sm">Agendar Vacina</Button>
                        </Link>
                    </div>

                    <div className="vaccine-list">
                        {vaccines.map((vac, i) => (
                            <div key={i} className={`vaccine-item ${vac.status}`}>
                                <div className="vac-status-indicator"></div>
                                <div className="vac-info">
                                    <h3>{vac.name}</h3>
                                    <p>Aplicada em: {vac.date} por {vac.vet}</p>
                                </div>
                                <div className="vac-due">
                                    <span>Próxima dose:</span>
                                    <strong>{vac.nextDue}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal de Editar Pet */}
            {isEditModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="modal-content" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1.5rem', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)' }}>
                        <h3 style={{ color: 'var(--color-secondary)', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Editar Perfil do Pet</h3>

                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>ID do Pet (Não editável)</label>
                                <input
                                    type="text"
                                    disabled
                                    value={pet.id}
                                    style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid var(--color-neutral-200)', borderRadius: '0.75rem', backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)', cursor: 'not-allowed' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Nome do Pet</label>
                                <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid var(--color-neutral-200)', borderRadius: '0.75rem', fontFamily: 'inherit' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Foto do Pet</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {editImage && (
                                        <img
                                            src={editImage}
                                            alt="Preview"
                                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '0.75rem', border: '1px solid var(--color-neutral-200)' }}
                                        />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ fontSize: '0.85rem' }}
                                    />
                                </div>
                                <small style={{ color: 'var(--color-neutral-600)', marginTop: '0.5rem', display: 'block' }}>Escolha uma foto do seu dispositivo.</small>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)} style={{ flex: 1 }}>
                                    Cancelar
                                </Button>
                                <Button type="submit" style={{ flex: 1 }}>
                                    Salvar Alterações
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PetProfile;
