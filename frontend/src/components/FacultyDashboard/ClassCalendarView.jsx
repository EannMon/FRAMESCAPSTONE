import React, { useState } from 'react';
import api from '../../services/api';

/**
 * ClassCalendarView — Monthly calendar grid showing class sessions.
 * Faculty can select sessions and bulk-update their status (cancel, move online, etc.).
 * Extracted from MyClassesPage to satisfy the 300-line rule.
 *
 * @param {Object}   props
 * @param {Array}    props.calendarEvents    - Array of calendar event objects
 * @param {Function} props.onEventsUpdate    - Callback to push updated events back to parent
 */
const ClassCalendarView = ({ calendarEvents, onEventsUpdate }) => {
    const [selectedSessions, setSelectedSessions] = useState([]);
    const [showManageModal, setShowManageModal] = useState(false);
    const [modalData, setModalData] = useState({ type: 'normal', reason: '' });

    const toggleSessionSelect = (id) => {
        setSelectedSessions(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    // Persist session exceptions to database, then update parent's event state
    const handleBulkUpdate = async () => {
        const selectedDates = selectedSessions.map(sessionId => {
            const event = calendarEvents.find(ev => ev.id === sessionId);
            return event ? event.date : null;
        }).filter(Boolean);

        if (selectedDates.length === 0) {
            alert("No valid sessions selected");
            return;
        }

        const firstSelected = calendarEvents.find(ev => selectedSessions.includes(ev.id));
        if (!firstSelected) {
            alert("Could not determine class");
            return;
        }

        const classId = parseInt(firstSelected.id.split('-')[0]);

        try {
            await api.post('/api/faculty/session-exceptions', {
                class_id: classId,
                session_dates: selectedDates,
                exception_type: modalData.type === 'normal' ? 'onsite' :
                    modalData.type === 'online-sync' ? 'online' : modalData.type,
                reason: modalData.reason || null
            });

            const updatedEvents = calendarEvents.map(ev => {
                if (selectedSessions.includes(ev.id)) {
                    return { ...ev, status: modalData.type, reason: modalData.reason };
                }
                return ev;
            });

            onEventsUpdate(updatedEvents);
            setShowManageModal(false);
            setSelectedSessions([]);
            alert("✅ Schedule updated and saved to database!");
        } catch (error) {
            if (error.code === 'ERR_CANCELED') return;
            console.error("Error saving session exceptions:", error);
            alert("❌ Failed to save changes: " + (error.userMessage || error.message));
        }
    };

    // --- Build calendar cells ---
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const calendarCells = [];

    for (let i = 0; i < startDay; i++) {
        calendarCells.push(<div key={`empty-${i}`} className="cal-cell empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const events = calendarEvents.filter(s => s.date === dateStr);

        calendarCells.push(
            <div key={day} className="cal-cell day">
                <div className="cal-day-number">{day}</div>
                <div className="cal-events-stack">
                    {events.map(ev => (
                        <div
                            key={ev.id}
                            className={`cal-event-pill ${ev.status === 'cancelled' ? 'cal-event-red' : 'cal-event-green'} ${selectedSessions.includes(ev.id) ? 'selected-pill' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleSessionSelect(ev.id); }}
                            title={`${ev.title} - Click to Select`}
                        >
                            {selectedSessions.includes(ev.id) && <i className="fas fa-check-circle pill-check"></i>}
                            <span>{ev.time} {ev.title}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="real-calendar-container fade-in">
            <div className="cal-controls-row">
                <div className="cal-title-group">
                    <h3>{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <span className="cal-instruction">Click events to select &amp; update status (e.g. Cancel)</span>
                </div>
                {selectedSessions.length > 0 && (
                    <button className="bulk-update-btn" onClick={() => setShowManageModal(true)}>
                        Update {selectedSessions.length} Selected
                    </button>
                )}
            </div>

            <div className="calendar-grid-wrapper">
                <div className="cal-header-row">
                    <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
                </div>
                <div className="cal-body-grid">{calendarCells}</div>
            </div>

            {/* Session Management Modal */}
            {showManageModal && (
                <div className="modal-overlay">
                    <div className="modal-content-box manage-modal">
                        <div className="modal-header">
                            <h3>Update Schedule Status</h3>
                            <button className="close-btn" onClick={() => setShowManageModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="info-banner">
                                <i className="fas fa-info-circle"></i> Update <strong>{selectedSessions.length}</strong> selected class(es).
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select value={modalData.type} onChange={(e) => setModalData({ ...modalData, type: e.target.value })}>
                                    <option value="normal">On-Site</option>
                                    <option value="online-sync">Synchronous Online</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Reason</label>
                                <select value={modalData.reason} onChange={(e) => setModalData({ ...modalData, reason: e.target.value })}>
                                    <option value="">-- Select Reason --</option>
                                    <option value="Health Related">Health Related</option>
                                    <option value="Natural Disaster">Natural Disaster</option>
                                    <option value="Internet Connectivity">Internet Connectivity</option>
                                    <option value="Holiday">Holiday</option>
                                    <option value="Faculty Leave">Faculty Leave</option>
                                    <option value="University Event">University Event</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowManageModal(false)}>Cancel</button>
                            <button className="save-btn" onClick={handleBulkUpdate}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassCalendarView;
