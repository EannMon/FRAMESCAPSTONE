import React from 'react';

/**
 * Extracted modal components for DeptHeadManagePage.
 * Keeps the parent page under the 300-line limit.
 */

// ===========================================
// Create Subject Modal
// ===========================================
export const CreateSubjectModal = ({ newCourse, setNewCourse, onSubmit, onClose }) => (
    <div className="modal-overlay">
        <div className="modal-content-box">
            <div className="modal-header">
                <h3>Add New Subject</h3>
                <button className="close-btn" onClick={onClose}>&times;</button>
            </div>
            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label>Subject Code</label>
                    <input type="text" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} required placeholder="e.g. IT 321" />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <input type="text" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} required />
                </div>
                <div className="form-group">
                    <label>Units</label>
                    <input type="number" value={newCourse.units} onChange={e => setNewCourse({ ...newCourse, units: e.target.value })} required min="1" max="6" />
                </div>
                <button type="submit" className="submit-btn full">Create Subject</button>
            </form>
        </div>
    </div>
);

// ===========================================
// Assign Faculty Modal
// ===========================================
export const AssignFacultyModal = ({ facultyList, onAssign, onClose }) => (
    <div className="modal-overlay">
        <div className="modal-content-box">
            <div className="modal-header">
                <h3>Assign Instructor</h3>
                <button className="close-btn" onClick={onClose}>&times;</button>
            </div>
            <div className="faculty-select-list">
                {facultyList.map(faculty => (
                    <button key={faculty.user_id} className="faculty-option-btn" onClick={() => onAssign(faculty.user_id, faculty.name)}>
                        <div className="fac-avatar">{faculty.name.charAt(0)}</div>
                        <span className="fac-name">{faculty.name}</span>
                    </button>
                ))}
                {facultyList.length === 0 && <div>No faculty found.</div>}
            </div>
        </div>
    </div>
);

// ===========================================
// Assign Room Modal
// ===========================================
export const AssignRoomModal = ({ roomForm, setRoomForm, availableRooms, onSubmit, onClose }) => (
    <div className="modal-overlay">
        <div className="modal-content-box">
            <div className="modal-header">
                <h3>Assign Room & Schedule</h3>
                <button className="close-btn" onClick={onClose}>&times;</button>
            </div>
            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label>Select Room</label>
                    <select
                        className="modal-select"
                        value={roomForm.roomName}
                        onChange={e => setRoomForm({ ...roomForm, roomName: e.target.value })}
                    >
                        {availableRooms.length > 0 ? (
                            availableRooms.map(r => <option key={r} value={r}>{r}</option>)
                        ) : (
                            <option value="">No rooms available</option>
                        )}
                    </select>
                </div>
                <div className="form-group">
                    <label>Day of Week</label>
                    <select
                        className="modal-select"
                        value={roomForm.day}
                        onChange={e => setRoomForm({ ...roomForm, day: e.target.value })}
                    >
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
                <div className="form-row">
                    <div className="form-group half">
                        <label>Start Time</label>
                        <input type="text" className="modal-input" placeholder="09:00 AM" required
                            value={roomForm.startTime}
                            onChange={e => setRoomForm({ ...roomForm, startTime: e.target.value })}
                        />
                    </div>
                    <div className="form-group half">
                        <label>End Time</label>
                        <input type="text" className="modal-input" placeholder="12:00 PM" required
                            value={roomForm.endTime}
                            onChange={e => setRoomForm({ ...roomForm, endTime: e.target.value })}
                        />
                    </div>
                </div>
                <button type="submit" className="submit-btn full">Save Assignment</button>
            </form>
        </div>
    </div>
);
