import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './SchedulePage.css';

const ClassItem = ({ time, title, room }) => (
  <div className="week-class-item">
    <span className="week-class-time">{time}</span>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span className="week-class-title" style={{ fontWeight: '600' }}>{title}</span>
      <span style={{ fontSize: '0.85em', color: '#888' }}>{room}</span>
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
  const fetchSchedule = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!storedUser) return;

      const userId = storedUser.id || storedUser.user_id;
      const response = await axios.get(`http://localhost:5000/api/student/schedule/${userId}`);
      const rawData = response.data;

      const newSchedule = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };

      rawData.forEach(cls => {
        if (newSchedule[cls.day_of_week]) {
          newSchedule[cls.day_of_week].push({
            time: `${cls.start_time} - ${cls.end_time}`,
            title: cls.course_name,
            room: cls.room_name
          });
        }
      });

      setWeekSchedule(newSchedule);
      setLoading(false);

    } catch (error) {
      console.error("Error fetching schedule:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
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
              <ClassItem key={index} time={cls.time} title={cls.title} room={cls.room} />
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
                    <ClassItem key={idx} time={cls.time} title={cls.title} room={cls.room} />
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
              <ClassItem key={index} time={cls.time} title={cls.title} room={cls.room} />
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