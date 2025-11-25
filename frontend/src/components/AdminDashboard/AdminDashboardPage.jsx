import React, { useState } from 'react';
import './AdminDashboardPage.css'; // Use the page-specific CSS

// ===========================================
// All Admin Dashboard Page Components
// ===========================================

const SummaryCard = ({ iconClass, title, value, subValue, subValueColor, iconBgClass }) => (
  <div className="card admin-summary-card">
    <div className={`admin-summary-icon-container ${iconBgClass}`}>
      <i className={iconClass}></i>
    </div>
    <div className="admin-summary-content">
      <div className="admin-summary-title">{title}</div>
      <div className="admin-summary-value">{value}</div>
      {subValue && (
        <div className="admin-summary-sub-value" style={{ color: subValueColor }}>
          {subValue}
        </div>
      )}
    </div>
  </div>
);

const SummaryCards = () => {
  return (
    <div className="admin-summary-cards-container">
      <SummaryCard 
        iconClass="fas fa-bell" 
        title="Active Alerts" 
        value="5" 
        subValue="2 Critical" 
        subValueColor="#dc3545" 
        iconBgClass="alert-bg"
      />
      <SummaryCard 
        iconClass="fas fa-users" 
        title="Total Users" 
        value="2,847" 
        subValue="+12 today" 
        subValueColor="#28a745" 
        iconBgClass="users-bg-red" // RED THEME
      />
      <SummaryCard 
        iconClass="fas fa-video" 
        title="Active Cameras" 
        value="48/52" 
        subValue="4 Offline" 
        subValueColor="#ffc107" 
        iconBgClass="cameras-bg"
      />
      <SummaryCard 
        iconClass="fas fa-shield-alt" 
        title="Attendance" 
        value="98.5%" 
        subValue="Excellent" 
        subValueColor="#28a745" 
        iconBgClass="attendance-bg"
      />
    </div>
  );
};

// ===========================================
// --- NEW: Room Availability Component (Classroom Vibe) ---
// ===========================================

// Mock data for room status (1 camera per room)
const roomData = {
    room1: {
        name: "Room 1",
        available: true,
        cameraOnline: true,
    },
    room2: {
        name: "Room 2",
        available: false,
        cameraOnline: false,
    }
};

// Reusable Room Box Component (New Design)
const RoomBox = ({ room }) => {
    const isAvailable = room.available;
    const isCameraOnline = room.cameraOnline;

    // Determine status text and classes
    const availabilityText = isAvailable ? "Available" : "In Use";
    const availabilityIcon = isAvailable ? "fas fa-door-open" : "fas fa-chalkboard-teacher";
    const availabilityClass = isAvailable ? "available" : "in-use";
    
    const cameraText = isCameraOnline ? "Camera Online" : "Camera Offline";
    const cameraIcon = isCameraOnline ? "fas fa-video" : "fas fa-video-slash";
    const cameraClass = isCameraOnline ? "online" : "offline";

    return (
        <div className={`admin-room-box-card ${availabilityClass}`}>
            <div className="admin-room-box-top-row">
                <h4 className="admin-room-box-title">{room.name}</h4>
                <div className={`admin-room-camera-status ${cameraClass}`}>
                    <i className={cameraIcon}></i>
                    <span>{cameraText}</span>
                </div>
            </div>
            <div className="admin-room-box-main-status">
                <i className={availabilityIcon}></i>
                <span>{availabilityText}</span>
            </div>
        </div>
    );
};


const RoomAvailability = () => {
    const [selectedView, setSelectedView] = useState('both');

    return (
        <div className="card admin-room-availability-card">
            <div className="admin-room-availability-header">
                <h3>Room Availability</h3>
                <div className="admin-room-availability-actions">
                    <select 
                        className="admin-building-selector" 
                        value={selectedView}
                        onChange={(e) => setSelectedView(e.target.value)}
                    >
                        <option value="both">Room 1 & 2</option>
                        <option value="room1">Room 1</option>
                        <option value="room2">Room 2</option>
                    </select>
                </div>
            </div>

            <div className="admin-room-box-container">
                {/* Conditionally render room boxes based on state */}
                {(selectedView === 'both' || selectedView === 'room1') && (
                    <RoomBox room={roomData.room1} />
                )}
                {(selectedView === 'both' || selectedView === 'room2') && (
                    <RoomBox room={roomData.room2} />
                )}
            </div>

            <div className="admin-room-availability-legend">
                {/* Removed camera offline/online, as it's in the card now */}
                <div className="admin-legend-item"><span className="admin-legend-color-box available-bg"></span> Room Available</div>
                <div className="admin-legend-item"><span className="admin-legend-color-box in-use-bg"></span> Room In Use</div>
            </div>
        </div>
    );
};

// ===========================================
// --- End Room Availability Component ---
// ===========================================


const AlertItem = ({ type, description, location, time, status, statusColor }) => (
  <div className="admin-alert-item">
    <span className={`admin-alert-type ${type}`}></span>
    <div className="admin-alert-details">
      <div className="admin-alert-description">
        <strong>{description}</strong> - {location}
      </div>
      <div className="admin-alert-time">{time}</div>
    </div>
    <span className="admin-alert-status" style={{ backgroundColor: statusColor }}>{status}</span>
  </div>
);

const RecentAlerts = () => {
  return (
    <div className="card admin-recent-alerts">
      <h3>Recent Alerts</h3>
      <div className="admin-alerts-list">
        <AlertItem type="red" description="Unauthorized access attempt" location="Building C" time="2 min ago" status="Active" statusColor="#dc3545" />
        <AlertItem type="yellow" description="System maintenance scheduled" location="Building A" time="15 min ago" status="Investigating" statusColor="#ffc107" />
        <AlertItem type="green" description="High occupancy detected" location="Library" time="1 hour ago" status="Resolved" statusColor="#28a745" />
      </div>
    </div>
  );
};

const StatusItem = ({ component, percentage, status, statusColor }) => (
  <div className="admin-status-item">
    <div className="admin-status-details">
      <div className="admin-status-component">{component}</div>
      <div className="admin-status-percentage">{percentage}</div>
    </div>
    <span className="admin-status-badge" style={{ backgroundColor: statusColor }}>{status}</span>
  </div>
);

const SystemStatus = () => {
  return (
    <div className="card admin-system-status">
      <h3>System Status</h3>
      <div className="admin-status-list">
        <StatusItem component="Facial Recognition Engine" percentage="Uptime: 99.9%" status="Online" statusColor="#28a745" />
        <StatusItem component="Gesture Control Module" percentage="Uptime: 98.7%" status="Online" statusColor="#28a745" />
        <StatusItem component="Database Cluster" percentage="Uptime: 100%" status="Online" statusColor="#28a745" />
        <StatusItem component="Alert Notification System" percentage="Uptime: 95.2%" status="Maintenance" statusColor="#ffc107" />
      </div>
    </div>
  );
};


// --- Main Dashboard Page ---
const AdminDashboardPage = () => {
  return (
    <div className="admin-dashboard-content-grid">
      <SummaryCards />
      <RoomAvailability /> {/* <-- UPDATED COMPONENT */}
      <RecentAlerts />
      <SystemStatus />
    </div>
  );
};

export default AdminDashboardPage;