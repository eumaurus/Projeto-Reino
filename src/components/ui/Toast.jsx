import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import './Toast.css';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

    return (
        <div className={`toast-container animate-slide-in ${type}`}>
            <div className="toast-content">
                <Icon size={20} className="toast-icon" />
                <span className="toast-message">{message}</span>
                <button onClick={onClose} className="toast-close">
                    <X size={16} />
                </button>
            </div>
            <div className="toast-progress"></div>
        </div>
    );
};

export default Toast;
