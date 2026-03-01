import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
    return ctx;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirmState, setConfirmState] = useState(null);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
    const error = useCallback((msg) => addToast(msg, 'error', 6000), [addToast]);
    const warning = useCallback((msg) => addToast(msg, 'warning', 5000), [addToast]);
    const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);

    const confirm = useCallback((message) => {
        return new Promise((resolve) => {
            setConfirmState({ message, resolve });
        });
    }, []);

    const handleConfirm = (result) => {
        if (confirmState) {
            confirmState.resolve(result);
            setConfirmState(null);
        }
    };

    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle',
    };

    return (
        <ToastContext.Provider value={{ success, error, warning, info, confirm }}>
            {children}

            {/* Toast Stack */}
            <div className="toast-stack">
                {toasts.map(t => (
                    <div key={t.id} className={`toast-item toast-${t.type}`}>
                        <i className={iconMap[t.type] || iconMap.info} />
                        <span className="toast-message">{t.message}</span>
                        <button className="toast-close" onClick={() => removeToast(t.id)}>&times;</button>
                    </div>
                ))}
            </div>

            {/* Confirm Dialog */}
            {confirmState && (
                <div className="toast-confirm-overlay">
                    <div className="toast-confirm-box">
                        <p>{confirmState.message}</p>
                        <div className="toast-confirm-actions">
                            <button className="toast-confirm-cancel" onClick={() => handleConfirm(false)}>Cancel</button>
                            <button className="toast-confirm-ok" onClick={() => handleConfirm(true)}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
};

export default ToastProvider;
