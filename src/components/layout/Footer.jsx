import React from 'react';
import { MapPin, Phone, MessageCircle, Instagram, Clock } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container footer-container">

                {/* Brand Column */}
                <div className="footer-col">
                    <div className="logo footer-logo">
                        <img src={logoImg} alt="Clínica Veterinária Reino Animal" className="logo-img-footer" />
                    </div>
                    <p className="footer-desc">
                        Cuidado excepcional e personalizado para cada paciente peludo. Atendimento humanizado, com preço justo e sem cultura de "ticket médio".
                    </p>
                    <div className="social-links">
                        <a href="https://instagram.com/vet.reinoanimal" target="_blank" rel="noopener noreferrer" className="social-link">
                            <Instagram size={20} />
                        </a>
                    </div>
                </div>

                {/* Links Column */}
                <div className="footer-col">
                    <h3 className="footer-title">Links Rápidos</h3>
                    <ul className="footer-links">
                        <li><a href="#home">Início</a></li>
                        <li><a href="#about">Sobre a Clínica</a></li>
                        <li><a href="#structure">Estrutura</a></li>
                        <li><a href="#services">Serviços</a></li>
                        <li><a href="#team">Nossa Equipe</a></li>
                    </ul>
                </div>

                {/* Contact Column */}
                <div className="footer-col">
                    <h3 className="footer-title">Contato</h3>
                    <ul className="footer-contact-info">
                        <li>
                            <MapPin size={18} className="contact-icon" />
                            <span>Rua Santa Úrsula, 205 - Vila São Jorge / Centro, Barueri - SP</span>
                        </li>
                        <li>
                            <Phone size={18} className="contact-icon" />
                            <span>(11) 4198-4301</span>
                        </li>
                        <li>
                            <MessageCircle size={18} className="contact-icon" />
                            <a href="https://wa.me/5511992352313" target="_blank" rel="noopener noreferrer">
                                (11) 99235-2313
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Hours Column */}
                <div className="footer-col">
                    <h3 className="footer-title">Horário de Funcionamento</h3>
                    <ul className="footer-contact-info">
                        <li>
                            <Clock size={18} className="contact-icon" />
                            <div>
                                <strong>Segunda a Sexta-feira</strong>
                                <br />09:00 às 18:00
                            </div>
                        </li>
                        <li>
                            <Clock size={18} className="contact-icon" />
                            <div>
                                <strong>Sábados</strong>
                                <br />09:00 às 14:00
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} Clínica Veterinária Reino Animal. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
