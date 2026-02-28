import React from 'react';

/**
 * Slide-up profile panel for DeptHeadUserManagementPage.
 * Shows user identity card + class schedule in a two-column grid.
 */
const UserProfilePanel = ({
    selectedUser,
    isPanelClosing,
    onClose,
    summarySchedule,
    summaryScheduleLoading,
}) => {
    if (!selectedUser) return null;

    return (
        <div className={`profile-panel-overlay ${isPanelClosing ? 'closing' : ''}`} onClick={onClose}>
            <div className={`profile-panel ${isPanelClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>

                {/* Pull-down handle to close */}
                <div className="panel-pull-handle" onClick={onClose}>
                    <i className="fas fa-chevron-down"></i>
                </div>

                {/* Panel Body — Two Column Grid */}
                <div className="panel-body">
                    {/* LEFT: Identity Card */}
                    <div className="panel-identity-card">
                        <div className="panel-identity-header">
                            <div className="panel-avatar">
                                {selectedUser.first_name
                                    ? selectedUser.first_name[0].toUpperCase()
                                    : selectedUser.name
                                        ? selectedUser.name[0].toUpperCase()
                                        : '?'}
                            </div>
                            <h3 className="panel-user-name">{selectedUser.name}</h3>
                            <span className={`role-tag ${selectedUser.roleColor}`}>{selectedUser.role}</span>
                        </div>

                        <div className="panel-identity-details">
                            <div className="panel-detail-row">
                                <i className="fas fa-envelope"></i>
                                <div>
                                    <span className="panel-detail-label">Email</span>
                                    <span className="panel-detail-value">{selectedUser.email}</span>
                                </div>
                            </div>
                            <div className="panel-detail-row">
                                <i className="fas fa-building"></i>
                                <div>
                                    <span className="panel-detail-label">Department</span>
                                    <span className="panel-detail-value">{selectedUser.department || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="panel-detail-row">
                                <i className="fas fa-id-badge"></i>
                                <div>
                                    <span className="panel-detail-label">TUPM ID</span>
                                    <span className="panel-detail-value">{selectedUser.tupm_id || selectedUser.user_id || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="panel-detail-row">
                                <i className="fas fa-check-circle"></i>
                                <div>
                                    <span className="panel-detail-label">Verification Status</span>
                                    <span className={`status-tag ${selectedUser.statusColor}`}>{selectedUser.status || 'Active'}</span>
                                </div>
                            </div>
                            <div className="panel-detail-row">
                                <i className="fas fa-camera"></i>
                                <div>
                                    <span className="panel-detail-label">Face Registration</span>
                                    <span className={`status-tag ${selectedUser.face_registered ? 'green' : 'yellow'}`}>
                                        {selectedUser.face_registered ? 'Registered' : 'Not Registered'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Schedule Card */}
                    <div className="panel-schedule-card">
                        <div className="panel-schedule-header">
                            <i className="fas fa-calendar-alt"></i>
                            <h3>Class Schedule</h3>
                        </div>
                        <div className="panel-schedule-body">
                            {summaryScheduleLoading ? (
                                <div className="panel-schedule-empty">
                                    <i className="fas fa-spinner fa-spin"></i>
                                    <p>Loading schedule...</p>
                                </div>
                            ) : summarySchedule.length > 0 ? (
                                <table className="panel-schedule-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Section</th>
                                            <th>Day</th>
                                            <th>Time</th>
                                            <th>Room</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summarySchedule.map((item, idx) => (
                                            <tr key={idx}>
                                                <td><strong>{item.subject_code}</strong></td>
                                                <td>{item.section}</td>
                                                <td>{item.day}</td>
                                                <td>{item.time}</td>
                                                <td><span className="panel-room-badge">{item.room}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="panel-schedule-empty">
                                    <i className="fas fa-calendar-times"></i>
                                    <p>No schedule data available.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserProfilePanel;
