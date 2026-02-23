import React, { useState, useEffect } from 'react';
import './FacultyReportModal.css';

const FacultyReportModal = ({
    isOpen,
    onClose,
    onGenerate,
    reportTitle,
    scope,
    dateRange,
    filters = "All Statuses"
}) => {
    const [format, setFormat] = useState('PDF'); // PDF or CSV
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormat('PDF'); // Reset format on open
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleGenerateClick = async () => {
        setLoading(true);
        // Simulate processing delay
        setTimeout(() => {
            onGenerate(format);
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="report-modal-overlay">
            <div className="report-modal-content">
                
                {/* Header */}
                <div className="report-modal-header">
                    <h3>Generate Official Report</h3>
                    <button className="close-modal-btn" onClick={onClose}>&times;</button>
                </div>

                {/* Body */}
                <div className="report-modal-body">
                    <p className="modal-info-text">
                        Please review your report settings before generating. The system will process 
                        <span className="bold-highlight"> 128-dimensional embedding logs</span> to create this summary.
                    </p>

                    <div className="config-card">
                        <div className="config-row">
                            <span className="config-label">Report Type:</span>
                            <span className="config-value">{reportTitle}</span>
                        </div>
                        <div className="config-row">
                            <span className="config-label">Subject/Scope:</span>
                            <span className="config-value">{scope}</span>
                        </div>
                        <div className="config-row">
                            <span className="config-label">Target Date:</span>
                            <span className="config-value">{dateRange}</span>
                        </div>
                        <div className="config-row">
                            <span className="config-label">Filters Applied:</span>
                            <span className="config-value">{filters}</span>
                        </div>
                    </div>

                    <div className="format-selection">
                        <label>Output Format:</label>
                        <div className="format-options">
                            <button 
                                className={`format-btn ${format === 'PDF' ? 'active' : ''}`}
                                onClick={() => setFormat('PDF')}
                            >
                                <i className="fas fa-file-pdf"></i> PDF
                            </button>
                            <button 
                                className={`format-btn ${format === 'CSV' ? 'active' : ''}`}
                                onClick={() => setFormat('CSV')}
                            >
                                <i className="fas fa-file-csv"></i> CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="report-modal-footer">
                    <button className="btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
                    <button 
                        className="btn-generate" 
                        onClick={handleGenerateClick}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Processing...
                            </>
                        ) : (
                            <>
                                Generate Report <i className="fas fa-chevron-right"></i>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FacultyReportModal;
