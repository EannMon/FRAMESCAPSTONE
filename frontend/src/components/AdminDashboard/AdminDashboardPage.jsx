import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminDashboardPage.css';

// ===========================================
// Reusable sub-components (pure presentational)
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

const RoomBox = ({ device }) => {
  const isOnline = device.status === 'ACTIVE';
  const cameraText = isOnline ? 'Camera Online' : 'Camera Offline';
  const cameraIcon = isOnline ? 'fas fa-video' : 'fas fa-video-slash';
  const cameraClass = isOnline ? 'online' : 'offline';

  return (
    <div className={`admin-room-box-card ${isOnline ? 'available' : 'in-use'}`}>
      <div className="admin-room-box-top-row">
        <h4 className="admin-room-box-title">{device.room || device.deviceName}</h4>
        <div className={`admin-room-camera-status ${cameraClass}`}>
          <i className={cameraIcon}></i>
          <span>{cameraText}</span>
        </div>
      </div>
      <div className="admin-room-box-main-status">
        <i className={isOnline ? 'fas fa-door-open' : 'fas fa-video-slash'}></i>
        <span>{isOnline ? 'Active' : device.status}</span>
      </div>
    </div>
  );
};

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

const StatusItem = ({ component, percentage, status, statusColor }) => (
  <div className="admin-status-item">
    <div className="admin-status-details">
      <div className="admin-status-component">{component}</div>
      <div className="admin-status-percentage">{percentage}</div>
    </div>
    <span className="admin-status-badge" style={{ backgroundColor: statusColor }}>{status}</span>
  </div>
);

// ===========================================
// Main Dashboard Page
// ===========================================

const AdminDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch summary stats and devices in parallel
        const [summaryRes, devicesRes] = await Promise.all([
          api.get('/api/admin/dashboard-summary', { signal: controller.signal }),
          api.get('/api/admin/devices', { signal: controller.signal }),
        ]);

        setSummary(summaryRes.data);
        setDevices(devicesRes.data);
      } catch (err) {
        if (err.code !== 'ERR_CANCELED') {
          setError(err.userMessage || 'Failed to load dashboard data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard-content-grid">
        <p style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
          Loading dashboard…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-content-grid">
        <p style={{ textAlign: 'center', padding: '2rem', color: '#dc3545' }}>{error}</p>
      </div>
    );
  }

  const { users, devices: deviceStats, attendance } = summary || {};

  return (
    <div className="admin-dashboard-content-grid">
      {/* Summary Cards — real data from /api/admin/dashboard-summary */}
      <div className="admin-summary-cards-container">
        <SummaryCard
          iconClass="fas fa-bell"
          title="Pending Verification"
          value={users?.pendingVerification ?? 0}
          subValue={users?.pendingVerification === 0 ? 'All clear' : 'Needs review'}
          subValueColor={users?.pendingVerification === 0 ? '#28a745' : '#ffc107'}
          iconBgClass="alert-bg"
        />
        <SummaryCard
          iconClass="fas fa-users"
          title="Total Users"
          value={users?.total ?? 0}
          subValue={users?.newToday ? `+${users.newToday} today` : 'No new users today'}
          subValueColor="#28a745"
          iconBgClass="users-bg-red"
        />
        <SummaryCard
          iconClass="fas fa-video"
          title="Active Cameras"
          value={`${deviceStats?.active ?? 0}/${deviceStats?.total ?? 0}`}
          subValue={
            deviceStats?.offline
              ? `${deviceStats.offline} Offline`
              : 'All online'
          }
          subValueColor={deviceStats?.offline ? '#ffc107' : '#28a745'}
          iconBgClass="cameras-bg"
        />
        <SummaryCard
          iconClass="fas fa-clipboard-check"
          title="Attendance Today"
          value={attendance?.entriesToday ?? 0}
          subValue={
            attendance?.lateToday
              ? `${attendance.lateToday} late`
              : 'No late entries'
          }
          subValueColor={attendance?.lateToday ? '#ffc107' : '#28a745'}
          iconBgClass="attendance-bg"
        />
      </div>

      {/* Room Availability — real device data from /api/admin/devices */}
      <div className="card admin-room-availability-card">
        <div className="admin-room-availability-header">
          <h3>Room Availability</h3>
        </div>
        <div className="admin-room-box-container">
          {devices.length > 0 ? (
            devices.map((d) => <RoomBox key={d.id} device={d} />)
          ) : (
            <p style={{ padding: '1rem', color: '#888' }}>No devices registered.</p>
          )}
        </div>
        <div className="admin-room-availability-legend">
          <div className="admin-legend-item">
            <span className="admin-legend-color-box available-bg"></span> Active
          </div>
          <div className="admin-legend-item">
            <span className="admin-legend-color-box in-use-bg"></span> Offline / Maintenance
          </div>
        </div>
      </div>

      {/* Recent Alerts — derived from attendance summary */}
      <div className="card admin-recent-alerts">
        <h3>Recent Alerts</h3>
        <div className="admin-alerts-list">
          {attendance?.entriesToday === 0 && attendance?.lateToday === 0 ? (
            <p style={{ padding: '1rem', color: '#888' }}>No activity yet today.</p>
          ) : (
            <>
              {attendance?.lateToday > 0 && (
                <AlertItem
                  type="yellow"
                  description={`${attendance.lateToday} late entries today`}
                  location="All rooms"
                  time="Today"
                  status="Monitor"
                  statusColor="#ffc107"
                />
              )}
              <AlertItem
                type="green"
                description={`${attendance.entriesToday} attendance entries recorded`}
                location="All rooms"
                time="Today"
                status="Normal"
                statusColor="#28a745"
              />
            </>
          )}
        </div>
      </div>

      {/* System Status — derived from device + summary data */}
      <div className="card admin-system-status">
        <h3>System Status</h3>
        <div className="admin-status-list">
          <StatusItem
            component="Database"
            percentage="Connected"
            status="Online"
            statusColor="#28a745"
          />
          <StatusItem
            component="Devices"
            percentage={`${deviceStats?.active ?? 0} of ${deviceStats?.total ?? 0} active`}
            status={deviceStats?.offline ? 'Partial' : 'Online'}
            statusColor={deviceStats?.offline ? '#ffc107' : '#28a745'}
          />
          <StatusItem
            component="Pending Users"
            percentage={`${users?.pendingVerification ?? 0} awaiting review`}
            status={users?.pendingVerification ? 'Action' : 'Clear'}
            statusColor={users?.pendingVerification ? '#ffc107' : '#28a745'}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;