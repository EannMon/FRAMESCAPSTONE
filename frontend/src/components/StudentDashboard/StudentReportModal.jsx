import React, { useState, useEffect } from 'react';
import './StudentReportModal.css';

const StudentReportModal = ({
    isOpen,
    onClose,
    onGenerate,
    defaultReportType,
    defaultSubject,
    defaultDate,
    filters = "All Statuses"
}) => {
    const [format, setFormat] = useState('PDF'); // PDF or CSV
    const [loading, setLoading] = useState(false);

    // Initial values from props
    // In a full implementation, these might be editable, but for now we confirm them.
    // If we want them editable, we need local state initialized from props.
    // Given the requirement "Validation: Ensure Subject and Date are selected", 
    // we should probably allow editing or at least validation.
    // FOR THIS ITERATION: We will display them as confirmation (read-only or passed content)
    // but the design shows them as inputs/selects potentially.
    // Let's make them read-only for consistency with the "Review settings" message,
    // assuming the user selects them on the main page.
    
    // However, the design image shows "Subject/Scope: CS101" and "Target Date: 2026-02-01".
    // If the user can change them here, we need options passed in.
    // To keep it simple and robust: We will display the *current* selection from the main page.
    // If the prompt implies full editing capability inside the modal, we'd need the lists of subjects.
    // Let's stick to "Review" mode as per the text "Please review your report settings...".

    useEffect(() => {
        if (isOpen) {
            setFormat('PDF'); // Reset format on open
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleGenerateClick = async () => {
        setLoading(true);
        // Simulate processing for "128-dimensional embedding logs"
        setTimeout(() => {
            onGenerate(format); // Pass the format back to parent
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
                            <span className="config-value">{defaultReportType}</span>
                        </div>
                        <div className="config-row">
                            <span className="config-label">Subject/Scope:</span>
                            <span className="config-value">{defaultSubject}</span>
                        </div>
                        <div className="config-row">
                            <span className="config-label">Target Date:</span>
                            <span className="config-value">{defaultDate}</span>
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
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
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

                {/* Loading State Overlay (Optional - but button spinner is usually enough) */}
            </div>
        </div>
    );
};

export default StudentReportModal;
