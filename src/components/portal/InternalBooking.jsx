import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    CheckCircle2, Calendar, Clock, ChevronLeft,
    Stethoscope, Syringe, Microscope, Scissors, Droplets,
    Check, PawPrint, AlertCircle
} from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { getPetsByOwnerId, createBooking } from '../../utils/db';
import './Portal.css';

const VACCINES = {
    Cachorro: [
        { id: 'v8',        name: 'Vacina Polivalente V8',                  info: 'Cobre 7 doenças. Reforço anual.' },
        { id: 'v10',       name: 'Vacina Polivalente V10',                 info: 'V8 + 2 cepas de Leptospirose. Reforço anual.' },
        { id: 'raiva',     name: 'Vacina Antirrábica (Raiva)',             info: 'Dose única inicial. Reforço anual.' },
        { id: 'gripe_inj', name: 'Vacina contra Tosse/Gripe (Injetável)', info: '2 doses iniciais. Reforço anual.' },
        { id: 'gripe_nasal',name: 'Vacina contra Tosse (Intranasal)',     info: 'Dose única inicial. Reforço anual.' },
        { id: 'giardia',   name: 'Vacina contra Giardíase',               info: '2 doses iniciais. Reforço anual.' },
        { id: 'leish',     name: 'Vacina contra Leishmaniose',            info: '3 doses iniciais. Reforço anual.' },
        { id: 'puppy',     name: 'Vacina Puppy (Cinomose/Parvo)',         info: 'Para filhotes jovens (30–45 dias).' },
        { id: 'lepto',     name: 'Vacina contra Leptospirose (Isolada)',  info: 'Reforço semestral.' },
        { id: 'lyme',      name: 'Vacina contra Doença de Lyme',         info: '2 doses iniciais. Reforço anual.' },
    ],
    Gato: [
        { id: 'v3',   name: 'Vacina Tríplice Felina - V3',    info: 'Panleucopenia/Rino/Calici. Reforço anual.' },
        { id: 'v4',   name: 'Vacina Quádrupla Felina - V4',   info: 'V3 + Clamidiose. Reforço anual.' },
        { id: 'v5',   name: 'Vacina Quíntupla Felina - V5',   info: 'V4 + FeLV. Reforço anual.' },
        { id: 'raiva_f', name: 'Vacina Antirrábica Felina',   info: 'Dose única inicial. Reforço anual.' },
        { id: 'felv', name: 'Vacina contra FeLV (Isolada)',   info: 'Reforço anual.' },
        { id: 'clam', name: 'Vacina contra Clamidiose',       info: 'Reforço anual.' },
        { id: 'bord', name: 'Vacina contra Bordetella',       info: 'Reforço anual.' },
        { id: 'derm', name: 'Vacina contra Dermatofitose',    info: '3 doses iniciais. Reforço anual.' },
        { id: 'pif',  name: 'Vacina contra PIF',              info: 'Aplicação intranasal. Reforço anual.' },
        { id: 'fiv',  name: 'Vacina contra FIV (AIDS Felina)',info: '3 doses iniciais. Reforço anual.' },
    ],
};

const SERVICES = [
    { id: 'consulta', name: 'Consulta Médica Geral', Icon: Stethoscope, desc: 'Avaliação clínica completa com veterinário', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  available: true },
    { id: 'vacina',   name: 'Vacinação',             Icon: Syringe,      desc: 'Escolha as vacinas para o seu pet',        color: '#10b981', bg: 'rgba(16,185,129,0.1)', available: true },
    { id: 'exame',    name: 'Exame Laboratorial',    Icon: Microscope,   desc: 'Hemograma, urina, fezes e mais',           color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', available: true },
    { id: 'cirurgia', name: 'Avaliação Cirúrgica',   Icon: Scissors,     desc: 'Pré-consulta para procedimentos',          color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', available: true },
    { id: 'banho',    name: 'Banho e Tosa',          Icon: Droplets,     desc: 'Em breve disponível',                      color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',available: false },
];

const SPECIES_EMOJI = { Cachorro: '🐕', Gato: '🐱' };

const InternalBooking = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [pets, setPets] = useState([]);
    const [stepIndex, setStepIndex] = useState(0);

    const [selectedPetId,      setSelectedPetId]      = useState('');
    const [selectedServiceId,  setSelectedServiceId]  = useState('');
    const [selectedVaccineIds, setSelectedVaccineIds] = useState([]);
    const [selectedDate,       setSelectedDate]       = useState('');
    const [selectedTime,       setSelectedTime]       = useState('');
    const [notes,              setNotes]              = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingId,    setBookingId]    = useState(null);
    const [submitError,  setSubmitError]  = useState(null);

    useEffect(() => {
        if (currentUser?.id) getPetsByOwnerId(currentUser.id).then(setPets);
    }, [currentUser?.id]);

    const selectedPet     = pets.find(p => p.id === selectedPetId);
    const selectedService = SERVICES.find(s => s.id === selectedServiceId);

    const steps = useMemo(() => {
        const base = [
            { id: 'pet',      label: 'Pet' },
            { id: 'service',  label: 'Serviço' },
        ];
        if (selectedServiceId === 'vacina') base.push({ id: 'vaccines', label: 'Vacinas' });
        base.push(
            { id: 'datetime', label: 'Horário' },
            { id: 'review',   label: 'Revisão' },
        );
        return base;
    }, [selectedServiceId]);

    const currentStepId = steps[stepIndex]?.id;
    const goNext = () => setStepIndex(i => i + 1);
    const goBack = () => setStepIndex(i => i - 1);

    const handleServiceSelect = (serviceId) => {
        setSelectedServiceId(serviceId);
        setSelectedVaccineIds([]);
    };

    const toggleVaccine = (id) => {
        setSelectedVaccineIds(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    };

    const validDates = useMemo(() => {
        const dates = [];
        const cur = new Date();
        cur.setDate(cur.getDate() + 1);
        while (dates.length < 14) {
            if (cur.getDay() !== 0) dates.push(new Date(cur));
            cur.setDate(cur.getDate() + 1);
        }
        return dates;
    }, []);

    const validTimes = useMemo(() => {
        if (!selectedDate) return [];
        const [y, m, d] = selectedDate.split('-').map(Number);
        const isSaturday = new Date(y, m - 1, d).getDay() === 6;
        const times = [];
        const endHour = isSaturday ? 14 : 18;
        for (let h = 9; h < endHour; h++) {
            times.push(`${String(h).padStart(2, '0')}:00`);
            times.push(`${String(h).padStart(2, '0')}:30`);
        }
        return times;
    }, [selectedDate]);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const petSpecies = selectedPet?.species === 'Gato' ? 'Gato' : 'Cachorro';
            const vaccines = selectedVaccineIds.map(id => {
                const vac = VACCINES[petSpecies]?.find(v => v.id === id);
                return vac ? { id: vac.id, name: vac.name } : { id };
            });
            const booking = await createBooking({
                ownerId:       currentUser.id,
                petId:         selectedPetId,
                service:       selectedService?.name ?? selectedServiceId,
                vaccines,
                requestedDate: selectedDate,
                requestedTime: selectedTime,
                notes:         notes.trim() || null,
            });
            setBookingId(booking.id);
        } catch {
            setSubmitError('Não foi possível confirmar o agendamento. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setStepIndex(0);
        setSelectedPetId('');
        setSelectedServiceId('');
        setSelectedVaccineIds([]);
        setSelectedDate('');
        setSelectedTime('');
        setNotes('');
        setBookingId(null);
        setSubmitError(null);
    };

    // ─── Step renderers ───────────────────────────────────────────────────────

    const renderProgress = () => (
        <div className="booking-steps">
            {steps.map((s, i) => (
                <React.Fragment key={s.id}>
                    {i > 0 && (
                        <div className={`booking-step-line ${i <= stepIndex ? 'done' : ''}`} />
                    )}
                    <div className={`booking-step ${i === stepIndex ? 'active' : i < stepIndex ? 'done' : ''}`}>
                        <div className="booking-step-number">
                            {i < stepIndex ? <Check size={12} /> : i + 1}
                        </div>
                        <span className="booking-step-label">{s.label}</span>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );

    const renderPetStep = () => (
        <div className="animate-fade-in visible">
            <h2 className="booking-step-title">Para qual pet?</h2>
            {pets.length === 0 ? (
                <div className="empty-pets" style={{ marginBottom: '2rem' }}>
                    <PawPrint size={32} />
                    <p>Nenhum pet cadastrado ainda</p>
                    <Link to="/dashboard" style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
                        Adicionar pet no Dashboard →
                    </Link>
                </div>
            ) : (
                <div className="booking-pet-grid">
                    {pets.map(pet => (
                        <div
                            key={pet.id}
                            className={`booking-pet-card ${selectedPetId === pet.id ? 'selected' : ''}`}
                            onClick={() => setSelectedPetId(pet.id)}
                        >
                            {pet.image ? (
                                <img src={pet.image} alt={pet.name} className="booking-pet-avatar" />
                            ) : (
                                <div className="booking-pet-avatar-placeholder">
                                    {SPECIES_EMOJI[pet.species] ?? '🐾'}
                                </div>
                            )}
                            <h4>{pet.name}</h4>
                            <span>{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</span>
                        </div>
                    ))}
                </div>
            )}
            <Button onClick={goNext} disabled={!selectedPetId} style={{ width: '100%' }}>
                Continuar
            </Button>
        </div>
    );

    const renderServiceStep = () => (
        <div className="animate-fade-in visible">
            <h2 className="booking-step-title">Qual serviço?</h2>
            <div className="booking-service-grid">
                {SERVICES.map(svc => {
                    const { Icon } = svc;
                    const isSelected = selectedServiceId === svc.id;
                    return (
                        <div
                            key={svc.id}
                            className={`booking-service-card ${!svc.available ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() => svc.available && handleServiceSelect(svc.id)}
                            style={{ borderColor: isSelected ? svc.color : undefined }}
                        >
                            <div className="booking-service-icon" style={{ background: svc.bg, color: svc.color }}>
                                <Icon size={20} />
                            </div>
                            <h4 style={{ color: isSelected ? svc.color : undefined }}>{svc.name}</h4>
                            <p>{svc.desc}</p>
                            {!svc.available && <div className="soon-badge">Em Breve</div>}
                        </div>
                    );
                })}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Button variant="outline" onClick={goBack} type="button">
                    <ChevronLeft size={16} /> Voltar
                </Button>
                <Button onClick={goNext} disabled={!selectedServiceId} style={{ flex: 1 }}>
                    Continuar
                </Button>
            </div>
        </div>
    );

    const renderVaccinesStep = () => {
        const petSpecies = selectedPet?.species === 'Gato' ? 'Gato' : 'Cachorro';
        const available  = VACCINES[petSpecies] ?? [];
        return (
            <div className="animate-fade-in visible">
                <h2 className="booking-step-title">Quais vacinas?</h2>
                <p style={{ color: 'var(--color-neutral-600)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                    Vacinas disponíveis para {petSpecies}. Selecione uma ou mais.
                </p>
                <div className="booking-vaccine-list">
                    {available.map(vac => {
                        const sel = selectedVaccineIds.includes(vac.id);
                        return (
                            <div
                                key={vac.id}
                                className={`booking-vaccine-item ${sel ? 'selected' : ''}`}
                                onClick={() => toggleVaccine(vac.id)}
                            >
                                <div className="booking-vaccine-checkbox">
                                    {sel && <Check size={10} color="white" strokeWidth={3} />}
                                </div>
                                <div className="booking-vaccine-info">
                                    <strong>{vac.name}</strong>
                                    <span>{vac.info}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" onClick={goBack} type="button">
                        <ChevronLeft size={16} /> Voltar
                    </Button>
                    <Button onClick={goNext} disabled={selectedVaccineIds.length === 0} style={{ flex: 1 }}>
                        Continuar
                        {selectedVaccineIds.length > 0 && ` (${selectedVaccineIds.length} selecionada${selectedVaccineIds.length !== 1 ? 's' : ''})`}
                    </Button>
                </div>
            </div>
        );
    };

    const renderDatetimeStep = () => (
        <div className="animate-fade-in visible">
            <h2 className="booking-step-title">Quando?</h2>

            <div className="booking-section-label">
                <Calendar size={15} /> Data preferencial
            </div>
            <div className="booking-date-grid">
                {validDates.map(d => {
                    const iso      = d.toISOString().split('T')[0];
                    const dayName  = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
                    const dayNum   = d.getDate();
                    const month    = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
                    return (
                        <div
                            key={iso}
                            className={`booking-date-chip ${selectedDate === iso ? 'selected' : ''}`}
                            onClick={() => { setSelectedDate(iso); setSelectedTime(''); }}
                        >
                            <div className="date-day">{dayName}</div>
                            <div className="date-num">{dayNum}</div>
                            <div className="date-month">{month}</div>
                        </div>
                    );
                })}
            </div>

            {selectedDate && (
                <>
                    <div className="booking-section-label">
                        <Clock size={15} /> Horário preferencial
                    </div>
                    <div className="booking-time-grid">
                        {validTimes.map(t => (
                            <div
                                key={t}
                                className={`booking-time-chip ${selectedTime === t ? 'selected' : ''}`}
                                onClick={() => setSelectedTime(t)}
                            >
                                {t}
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-neutral-500)', marginBottom: '1.5rem' }}>
                        Seg–Sex: 09h–18h &nbsp;|&nbsp; Sábado: 09h–14h
                    </p>
                </>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
                <Button variant="outline" onClick={goBack} type="button">
                    <ChevronLeft size={16} /> Voltar
                </Button>
                <Button onClick={goNext} disabled={!selectedDate || !selectedTime} style={{ flex: 1 }}>
                    Revisar Agendamento
                </Button>
            </div>
        </div>
    );

    const renderReviewStep = () => {
        const petSpecies = selectedPet?.species === 'Gato' ? 'Gato' : 'Cachorro';
        const vacNames   = selectedVaccineIds.map(id => VACCINES[petSpecies]?.find(v => v.id === id)?.name ?? id);
        const [y, m, d]  = selectedDate.split('-').map(Number);
        const dateLabel  = new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

        return (
            <div className="animate-fade-in visible">
                <h2 className="booking-step-title">Confirme o agendamento</h2>

                <div className="booking-review-card">
                    <div className="booking-review-row">
                        <span className="label">Pet</span>
                        <span className="value">{selectedPet?.name} ({selectedPet?.species})</span>
                    </div>
                    <div className="booking-review-row">
                        <span className="label">Serviço</span>
                        <span className="value">{selectedService?.name}</span>
                    </div>
                    {vacNames.length > 0 && (
                        <div className="booking-review-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
                            <span className="label">Vacinas ({vacNames.length})</span>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-secondary)', lineHeight: 1.7 }}>
                                {vacNames.map(n => <li key={n}>{n}</li>)}
                            </ul>
                        </div>
                    )}
                    <div className="booking-review-row">
                        <span className="label">Data solicitada</span>
                        <span className="value" style={{ textAlign: 'right', textTransform: 'capitalize' }}>{dateLabel}</span>
                    </div>
                    <div className="booking-review-row">
                        <span className="label">Horário</span>
                        <span className="value">{selectedTime}</span>
                    </div>
                    <div className="booking-review-row">
                        <span className="label">Local</span>
                        <span className="value">Reino Animal — Rua Santa Úrsula, 205</span>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label>Observações (opcional)</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Ex: pet idoso, precisa de sedação, sintomas atuais..."
                        rows={3}
                        style={{ resize: 'vertical' }}
                    />
                </div>

                {submitError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        <AlertCircle size={16} /> {submitError}
                    </div>
                )}

                <p style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)', marginBottom: '1.5rem' }}>
                    Este é um agendamento de intenção. Nossa recepção confirmará o horário exato em breve.
                </p>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" onClick={goBack} disabled={isSubmitting} type="button">
                        <ChevronLeft size={16} /> Voltar
                    </Button>
                    <Button onClick={handleConfirm} disabled={isSubmitting} style={{ flex: 1 }}>
                        {isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}
                    </Button>
                </div>
            </div>
        );
    };

    const renderSuccessStep = () => (
        <div className="booking-success animate-fade-in visible">
            <div className="booking-success-icon">
                <CheckCircle2 size={40} color="#10b981" />
            </div>
            <h2 style={{ color: 'var(--color-secondary)', fontSize: '1.75rem', marginBottom: '0.75rem' }}>
                Agendamento Solicitado!
            </h2>
            <p style={{ color: 'var(--color-neutral-600)', marginBottom: 0 }}>
                Recebemos sua solicitação de <strong>{selectedService?.name}</strong> para <strong>{selectedPet?.name}</strong>.
            </p>
            {bookingId && (
                <div className="booking-ref">
                    Protocolo do agendamento
                    <strong>#{bookingId.slice(0, 8).toUpperCase()}</strong>
                </div>
            )}
            <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-500)', marginBottom: '1.75rem' }}>
                Nossa equipe confirmará o horário em breve pelo telefone cadastrado.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Button onClick={() => navigate('/dashboard')} style={{ width: '100%' }}>
                    Voltar para o Dashboard
                </Button>
                <Button variant="outline" onClick={handleReset} style={{ width: '100%' }}>
                    Fazer Novo Agendamento
                </Button>
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        if (bookingId) return renderSuccessStep();
        switch (currentStepId) {
            case 'pet':      return renderPetStep();
            case 'service':  return renderServiceStep();
            case 'vaccines': return renderVaccinesStep();
            case 'datetime': return renderDatetimeStep();
            case 'review':   return renderReviewStep();
            default:         return null;
        }
    };

    return (
        <div className="portal-page">
            <div className="container" style={{ maxWidth: '800px' }}>
                <div className="portal-header">
                    <div>
                        <h1 className="portal-title">Novo Agendamento</h1>
                        <p className="portal-subtitle">Agende serviços para o seu pet de forma rápida e fácil.</p>
                    </div>
                </div>

                <div className="auth-card" style={{ maxWidth: '100%', margin: '0 auto' }}>
                    {!bookingId && renderProgress()}
                    {renderCurrentStep()}
                </div>
            </div>
        </div>
    );
};

export default InternalBooking;
