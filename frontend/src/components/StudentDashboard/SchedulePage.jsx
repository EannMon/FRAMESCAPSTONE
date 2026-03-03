import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './SchedulePage.css';

/**
 * Converts 24-hour time string (e.g. "22:45:00") to 12-hour format ("10:45 PM").
 * Returns '—' if input is null/undefined.
 */
const formatTo12Hr = (timeStr) => {
  if (!timeStr) return '—';
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
};

const ClassItem = ({ time, title, subjectCode, room, professor, section }) => (
  <div className="week-class-item">
    <span className="week-class-time">{time}</span>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span className="week-class-title" style={{ fontWeight: '600' }}>{subjectCode} — {title}</span>
      {section && <span style={{ fontSize: '0.82em', color: '#475569', fontWeight: '500' }}>Section: {section}</span>}
      {professor && <span style={{ fontSize: '0.82em', color: '#64748b' }}><i className="fas fa-user-tie" style={{ marginRight: '4px', fontSize: '0.75em' }}></i>{professor}</span>}
      <span style={{ fontSize: '0.82em', color: '#888' }}><i className="fas fa-map-marker-alt" style={{ marginRight: '4px', fontSize: '0.75em' }}></i>{room || 'TBA'}</span>
    </div>
  </div>
);

const SchedulePage = () => {
  const [activeFilter, setActiveFilter] = useState('This Week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekSchedule, setWeekSchedule] = useState({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
  });
  const [loading, setLoading] = useState(true);

  // --- FETCH SCHEDULE FUNCTION ---
  const fetchSchedule = async (signal) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!storedUser) return;

      const userId = storedUser.id || storedUser.user_id;
      const response = await api.get(`/api/student/schedule/${userId}`, { signal });
      const rawData = response.data;

      const newSchedule = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };

      rawData.forEach(cls => {
        if (newSchedule[cls.day_of_week]) {
          newSchedule[cls.day_of_week].push({
            time: `${formatTo12Hr(cls.start_time)} - ${formatTo12Hr(cls.end_time)}`,
            title: cls.subject_title || 'Unknown Subject',
            subjectCode: cls.subject_code || '—',
            room: cls.room || 'TBA',
            professor: cls.faculty_name || 'TBA',
            section: cls.section || null,
          });
        }
      });

      setWeekSchedule(newSchedule);
      setLoading(false);

    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        console.error("Error fetching schedule:", error);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchSchedule(controller.signal);
    return () => controller.abort();
  }, []);


  // Calendar Helpers
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const selectedDayName = dayNames[selectedDate.getDay()];
  const classesForSelectedDay = weekSchedule[selectedDayName] || [];
  const todayName = dayNames[new Date().getDay()];
  const classesForToday = weekSchedule[todayName] || [];

  if (loading) return <div style={{ padding: '30px' }}>Loading Schedule...</div>;

  return (
    <div className="schedule-view-container">

      {/* --- AUTO-SYNC INFO BANNER --- */}
      <div className="card" style={{
        marginBottom: '20px',
        borderLeft: '5px solid #2E7D32',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '16px 20px',
        background: '#F1FDF4'
      }}>
        <i className="fas fa-sync-alt" style={{ fontSize: '1.4rem', color: '#2E7D32' }} />
        <div>
          <div style={{ fontWeight: 700, color: '#1a5c2a', marginBottom: 2 }}>
            Schedule Automatically Synced
          </div>
          <div style={{ fontSize: '0.875em', color: '#388E3C' }}>
            Your class schedule is automatically populated from your enrollment records. No action needed — it updates whenever you are enrolled in or dropped from a class.
          </div>
        </div>
      </div>

      {/* --- HEADER --- */}
      <div className="schedule-header">
        <h2>My Class Schedule</h2>
        <div className="schedule-filters">
          {['Today', 'This Week', 'Calendar'].map(filter => (
            <button
              key={filter}
              className={`schedule-filter-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* --- VIEWS --- */}
      {activeFilter === 'Today' && (
        <div className="today-classes-card card">
          <h3>Today's Classes ({todayName})</h3>
          {classesForToday.length > 0 ? (
            classesForToday.map((cls, index) => (
              <ClassItem key={index} time={cls.time} title={cls.title} subjectCode={cls.subjectCode} room={cls.room} professor={cls.professor} section={cls.section} />
            ))
          ) : (
            <p style={{ color: '#777' }}>No classes scheduled for today.</p>
          )}
        </div>
      )}

      {activeFilter === 'This Week' && (
        <div className="week-schedule-grid">
          {Object.entries(weekSchedule).map(([day, classes]) => (
            (classes.length > 0 || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day)) && (
              <div className="card week-day-card" key={day}>
                <div className="week-day-header">
                  <span className="day-name">{day}</span>
                </div>
                <div className="week-day-classes">
                  {classes.length > 0 ? classes.map((cls, idx) => (
                    <ClassItem key={idx} time={cls.time} title={cls.title} subjectCode={cls.subjectCode} room={cls.room} professor={cls.professor} section={cls.section} />
                  )) : <div className="week-class-item none">No classes</div>}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {activeFilter === 'Calendar' && (
        <div className="calendar-view">
          <Calendar onChange={setSelectedDate} value={selectedDate} />
          <h3 style={{ marginTop: '20px' }}>Classes on {selectedDate.toDateString()}</h3>
          {classesForSelectedDay.length > 0 ? (
            classesForSelectedDay.map((cls, index) => (
              <ClassItem key={index} time={cls.time} title={cls.title} subjectCode={cls.subjectCode} room={cls.room} professor={cls.professor} section={cls.section} />
            ))
          ) : (
            <p>No classes on this day.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SchedulePage;