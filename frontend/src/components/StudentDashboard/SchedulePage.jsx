import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './SchedulePage.css';

const ClassItem = ({ time, title }) => (
  <div className="week-class-item">
    <span className="week-class-time">{time}</span>
    <span className="week-class-title">{title}</span>
  </div>
);

const SchedulePage = () => {
  const [activeFilter, setActiveFilter] = useState('Today');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekSchedule = {
    Monday: [
      { time: "09:00 AM", title: "Computer Science 101" },
      { time: "11:00 AM", title: "Mathematics" }
    ],
    Tuesday: [
      { time: "02:00 PM", title: "Physics Lab" }
    ],
    Wednesday: [
      { time: "09:00 AM", title: "Computer Science 101" },
      { time: "11:00 AM", title: "Mathematics" },
      { time: "04:00 PM", title: "English Literature" }
    ],
    Thursday: [
      { time: "02:00 PM", title: "Physics Lab" }
    ],
    Friday: [
      { time: "09:00 AM", title: "Computer Science 101" },
      { time: "04:00 PM", title: "English Literature" }
    ],
    Saturday: [],
    Sunday: []
  };

  // Get the day name from selected date
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const selectedDayName = dayNames[selectedDate.getDay()];
  const classesForSelectedDay = weekSchedule[selectedDayName] || [];

  return (
    <div className="schedule-view-container">
      <div className="schedule-header">
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

      {activeFilter === 'Today' && (
        <div className="today-classes-card card">
          <h3>Today's Classes</h3>
          {classesForSelectedDay.length > 0 ? (
            classesForSelectedDay.map((cls, index) => (
              <ClassItem key={index} time={cls.time} title={cls.title} />
            ))
          ) : (
            <p>No classes today.</p>
          )}
        </div>
      )}

      {activeFilter === 'This Week' && (
        <div className="week-schedule-grid">
          {Object.entries(weekSchedule).map(([day, classes]) => (
            <div className="card week-day-card" key={day}>
              <div className="week-day-header">
                <span className="day-name">{day}</span>
              </div>
              <div className="week-day-classes">
                {classes.length > 0 ? classes.map((cls, idx) => (
                  <ClassItem key={idx} time={cls.time} title={cls.title} />
                )) : <div className="week-class-item none">No classes</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeFilter === 'Calendar' && (
        <div className="calendar-view">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
          />
          <h3>Classes on {selectedDate.toDateString()}</h3>
          {classesForSelectedDay.length > 0 ? (
            classesForSelectedDay.map((cls, index) => (
              <ClassItem key={index} time={cls.time} title={cls.title} />
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