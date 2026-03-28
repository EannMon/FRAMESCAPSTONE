import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatTo12Hr } from '../../utils/timeUtils';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './SchedulePage.css';

const ClassItem = ({ time, title, subjectCode, room, professor, section }) => (
  <div className="week-class-item">
    <span className="week-class-time">{time}</span>
    <div className="class-item-details">
      <span className="week-class-title class-title-main">{subjectCode} — {title}</span>
      {section && <span className="class-meta-text class-section">Section: {section}</span>}
      {professor && <span className="class-meta-text class-professor"><i className="fas fa-user-tie class-meta-icon"></i>{professor}</span>}
      <span className="class-meta-text class-room"><i className="fas fa-map-marker-alt class-meta-icon"></i>{room || 'TBA'}</span>
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
            startSortValue: cls.start_time || '99:99:99',
            time: `${formatTo12Hr(cls.start_time)} - ${formatTo12Hr(cls.end_time)}`,
            title: cls.subject_title || 'Unknown Subject',
            subjectCode: cls.subject_code || '—',
            room: cls.room || 'TBA',
            professor: cls.faculty_name || 'TBA',
            section: cls.section || null,
          });
        }
      });

      Object.keys(newSchedule).forEach((day) => {
        newSchedule[day].sort((a, b) => a.startSortValue.localeCompare(b.startSortValue));
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

  if (loading) return <div className="schedule-loading">Loading Schedule...</div>;

  return (
    <div className="schedule-view-container">

      {/* --- AUTO-SYNC INFO BANNER --- */}
      <div className="card auto-sync-banner">
        <i className="fas fa-sync-alt sync-icon" />
        <div>
          <div className="sync-title">
            Schedule Automatically Synced
          </div>
          <div className="sync-description">
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
            <p className="no-classes-message">No classes scheduled for today.</p>
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