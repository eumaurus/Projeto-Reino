import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { getPetsByOwnerId } from '../../utils/mockDb';
import './Portal.css';

const InternalBooking = () => {
    const [step, setStep] = useState(1);
    const [selectedPet, setSelectedPet] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const { currentUser } = useAuth();
    const [pets] = useState(() => getPetsByOwnerId(currentUser.id));
    const navigate = useNavigate();

    const getValidDates = () => {
        const dates = [];
        let curDate = new Date();
        curDate.setDate(curDate.getDate() + 1); // Start from tomorrow
        while (dates.length < 14) {
            if (curDate.getDay() !== 0) { // 0 is Sunday
                dates.push(new Date(curDate));
            }
            curDate.setDate(curDate.getDate() + 1);
        }
        return dates;
    };

    // We only call this once during render
    const [validDates] = useState(getValidDates());

    const getValidTimes = () => {
        if (!selectedDate) return [];
        const dateObj = new Date(selectedDate);
        // Correct for timezone offset when parsing "YYYY-MM-DD"
        const isSaturday = new Date(dateObj.getTime() + Math.abs(dateObj.getTimezoneOffset() * 60000)).getDay() === 6;
        const times = [];
        const endHour = isSaturday ? 14 : 18;
        for (let h = 9; h < endHour; h++) {
            times.push(`${h.toString().padStart(2, '0')}:00`);
            times.push(`${h.toString().padStart(2, '0')}:30`);
        }
        return times;
    };

    const services = [
        'Consulta Médica Geral',
        'Banho e Tosa',
        'Vacinação',
        'Exame Laboratorial',
        'Avaliação Cirúrgica'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        setStep(4); // Success step
    };

    return (
        <div className="portal-page">
            <div className="container" style={{ maxWidth: '800px' }}>
                <div className="portal-header">
                    <div>
                        <h1 className="portal-title">Novo Agendamento</h1>
                        <p className="portal-subtitle">Agende serviços rapidamente através do portal.</p>
                    </div>
                </div>

                <div className="auth-card" style={{ maxWidth: '100%', margin: '0 auto' }}>

                    {/* Progress Bar */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ color: step >= 1 ? 'var(--color-primary)' : 'var(--color-neutral-200)', fontWeight: 'bold' }}>1. Serviço</div>
                        <ChevronRight size={16} color="var(--color-neutral-200)" />
                        <div style={{ color: step >= 2 ? 'var(--color-primary)' : 'var(--color-neutral-200)', fontWeight: 'bold' }}>2. Data/Hora</div>
                        <ChevronRight size={16} color="var(--color-neutral-200)" />
                        <div style={{ color: step >= 3 ? 'var(--color-primary)' : 'var(--color-neutral-200)', fontWeight: 'bold' }}>3. Confirmação</div>
                    </div>

                    {step === 1 && (
                        <div className="animate-fade-in visible">
                            <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-secondary)' }}>Qual pet e serviço?</h2>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Selecione o Pet</label>
                                <select value={selectedPet} onChange={e => setSelectedPet(e.target.value)} required>
                                    <option value="" disabled>Escolha um pet...</option>
                                    {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label>Serviço Desejado</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                                    {services.map(srv => {
                                        const isSoon = srv === 'Banho e Tosa';
                                        return (
                                            <div
                                                key={srv}
                                                onClick={() => !isSoon && setSelectedService(srv)}
                                                className={`service-selection-card ${selectedService === srv ? 'active' : ''} ${isSoon ? 'disabled' : ''}`}
                                                style={{
                                                    padding: '1rem',
                                                    border: `2px solid ${selectedService === srv ? 'var(--color-primary)' : 'var(--color-neutral-200)'}`,
                                                    borderRadius: '0.75rem',
                                                    cursor: isSoon ? 'not-allowed' : 'pointer',
                                                    backgroundColor: selectedService === srv ? 'rgba(115, 198, 232, 0.05)' : 'white',
                                                    transition: 'all 0.2s',
                                                    fontWeight: '500',
                                                    position: 'relative',
                                                    opacity: isSoon ? 0.7 : 1,
                                                    overflow: 'hidden',
                                                    minHeight: '60px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {srv}
                                                {isSoon && (
                                                    <div className="soon-badge">Em Breve</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <Button
                                onClick={() => setStep(2)}
                                disabled={!selectedPet || !selectedService}
                                style={{ width: '100%' }}
                            >
                                Continuar
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in visible">
                            <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-secondary)' }}>Escolha a data e o horário</h2>
                            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label>Data Preferencial (Exceto Domingos)</label>
                                    <div className="input-with-icon">
                                        <Calendar size={18} className="input-icon" />
                                        <select
                                            value={selectedDate}
                                            onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                                            required
                                        >
                                            <option value="" disabled>Selecione uma data disponível</option>
                                            {validDates.map((d, i) => (
                                                <option key={i} value={d.toISOString().split('T')[0]}>
                                                    {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <label>Horário Preferencial</label>
                                    <div className="input-with-icon">
                                        <Clock size={18} className="input-icon" />
                                        <select
                                            value={selectedTime}
                                            onChange={(e) => setSelectedTime(e.target.value)}
                                            required
                                            disabled={!selectedDate}
                                        >
                                            <option value="" disabled>
                                                {selectedDate ? 'Selecione um horário' : 'Selecione uma data primeiro'}
                                            </option>
                                            {getValidTimes().map((t, i) => (
                                                <option key={i} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <small style={{ color: 'var(--color-neutral-700)', marginTop: '0.5rem' }}>Funcionamento: Seg-Sex (09h-18h), Sábados (09h-14h)</small>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Button variant="outline" onClick={() => setStep(1)} type="button">Voltar</Button>
                                    <Button type="submit" style={{ flex: 1 }}>Continuar para Revisão</Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-in visible">
                            <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-secondary)' }}>Revise os dados do agendamento</h2>

                            <div style={{ backgroundColor: 'var(--color-neutral-50)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                                <p style={{ marginBottom: '0.5rem' }}><strong>Pet:</strong> {pets.find(p => p.id === selectedPet)?.name}</p>
                                <p style={{ marginBottom: '0.5rem' }}><strong>Serviço:</strong> {selectedService}</p>
                                <p style={{ marginBottom: '0.5rem' }}><strong>Data solicitada:</strong> {selectedDate.split('-').reverse().join('/')} às {selectedTime}</p>
                                <p style={{ marginBottom: '0.5rem' }}><strong>Local:</strong> Reino Animal (Rua Santa Úrsula, 205)</p>
                                <p style={{ color: 'var(--color-neutral-700)', fontSize: '0.9rem', marginTop: '1rem' }}>
                                    * Este é um agendamento de intenção. Nossa recepção confirmará seu horário exato em minutos através de uma notificação ou contato.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem' }}>
                                <Button variant="outline" onClick={() => setStep(2)} type="button">Voltar</Button>
                                <Button type="submit" style={{ flex: 1 }}>Confirmar Agendamento</Button>
                            </form>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="animate-fade-in visible" style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
                            <h2 style={{ color: 'var(--color-secondary)', fontSize: '2rem', marginBottom: '1rem' }}>Agendamento Solicitado!</h2>
                            <p style={{ color: 'var(--color-neutral-700)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                                Recebemos sua solicitação de agendamento. Você receberá uma notificação em breve confirmando o horário para o serviço de <strong>{selectedService}</strong>.
                            </p>
                            <Button onClick={() => navigate('/dashboard')} style={{ width: '100%' }}>
                                Voltar para o Dashboard
                            </Button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default InternalBooking;
