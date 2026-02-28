import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState(null);

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastId;
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

    // Convenience methods
    const success = useCallback((msg, duration) => showToast(msg, 'success', duration), [showToast]);
    const error = useCallback((msg, duration) => showToast(msg, 'error', duration), [showToast]);
    const warning = useCallback((msg, duration) => showToast(msg, 'warning', duration), [showToast]);
    const info = useCallback((msg, duration) => showToast(msg, 'info', duration), [showToast]);

    // Confirm dialog (replaces window.confirm)
    const confirm = useCallback((message) => {
        return new Promise((resolve) => {
            setConfirmDialog({ message, resolve });
        });
    }, []);

    const handleConfirm = useCallback((result) => {
        if (confirmDialog) {
            confirmDialog.resolve(result);
            setConfirmDialog(null);
        }
    }, [confirmDialog]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info, confirm }}>
            {children}

            {/* Toast Container */}
            <div className="frames-toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`frames-toast frames-toast-${toast.type}`}>
                        <div className="frames-toast-icon">
                            {toast.type === 'success' && <i className="fas fa-check-circle"></i>}
                            {toast.type === 'error' && <i className="fas fa-times-circle"></i>}
                            {toast.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                            {toast.type === 'info' && <i className="fas fa-info-circle"></i>}
                        </div>
                        <p className="frames-toast-message">{toast.message}</p>
                        <button className="frames-toast-close" onClick={() => removeToast(toast.id)}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                ))}
            </div>

            {/* Confirm Dialog */}
            {confirmDialog && (
                <div className="frames-confirm-overlay" onClick={() => handleConfirm(false)}>
                    <div className="frames-confirm-dialog" onClick={e => e.stopPropagation()}>
                        <div className="frames-confirm-icon">
                            <i className="fas fa-question-circle"></i>
                        </div>
                        <p className="frames-confirm-message">{confirmDialog.message}</p>
                        <div className="frames-confirm-actions">
                            <button className="frames-confirm-btn frames-confirm-cancel" onClick={() => handleConfirm(false)}>
                                Cancel
                            </button>
                            <button className="frames-confirm-btn frames-confirm-yes" onClick={() => handleConfirm(true)}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
};
