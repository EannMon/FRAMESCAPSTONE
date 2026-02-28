import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
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
  const { user: authUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState('This Week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekSchedule, setWeekSchedule] = useState({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
  });
  const [loading, setLoading] = useState(true);

  // Upload States
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- FETCH SCHEDULE (with AbortController cleanup) ---
  useEffect(() => {
    const controller = new AbortController();

    const fetchSchedule = async () => {
      try {
        if (!authUser) return;

        const userId = authUser.id || authUser.user_id;
        const response = await api.get(`/api/student/schedule/${userId}`, { signal: controller.signal });
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
      } catch (err) {
        if (err.code !== 'ERR_CANCELED') {
          console.error('Error fetching schedule:', err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchSchedule();
    return () => controller.abort();
  }, [refreshTrigger]);

  // --- HANDLE FILE UPLOAD ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate PDF
    if (file.type !== 'application/pdf') {
      alert("Please upload a valid PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', authUser.id || authUser.user_id);

    setUploading(true);

    try {
      const response = await api.post('/api/student/upload-cor', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert(`Success! ${response.data.message}`);
      setRefreshTrigger(prev => prev + 1); // Trigger schedule re-fetch
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload Failed: ${error.userMessage || 'Failed to parse CoR.'}`);
    } finally {
      setUploading(false);
      // Clear the input so you can upload the same file again if needed
      event.target.value = null;
    }
  };

  // Calendar Helpers
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const selectedDayName = dayNames[selectedDate.getDay()];
  const classesForSelectedDay = weekSchedule[selectedDayName] || [];
  const todayName = dayNames[new Date().getDay()];
  const classesForToday = weekSchedule[todayName] || [];

  if (loading) return <div style={{ padding: '30px' }}>Loading Schedule...</div>;

  return (
    <div className="schedule-view-container">

      {/* --- 1. UPLOAD COR SECTION --- */}
      {showUpload && (
        <div className="card upload-cor-section" style={{ marginBottom: '20px', borderLeft: '5px solid #163269' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>Schedule Setup</h3>
              <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>
                Upload your Certificate of Registration (PDF) to generate your schedule.
              </p>

              {/* NEW: Show Uploaded File Name & View Link */}
              <div id="file-preview" style={{ marginTop: '10px', fontSize: '0.9em' }}></div>
            </div>
            <div>
              <input
                type="file"
                accept="application/pdf"
                id="cor-upload"
                style={{ display: 'none' }}
                onChange={(e) => {
                  // Logic to show preview immediately
                  if (e.target.files[0]) {
                    const file = e.target.files[0];
                    const fileUrl = URL.createObjectURL(file);
                    const previewDiv = document.getElementById('file-preview');
                    previewDiv.innerHTML = `
                                    <span style="color:#28a745; font-weight:600;">
                                        <i class="fas fa-check-circle"></i> Selected: 
                                    </span> 
                                    <a href="${fileUrl}" target="_blank" style="color:#A62525; text-decoration:underline; margin-left:5px;">
                                        ${file.name}
                                    </a>
                                  `;
                    handleFileUpload(e); // Proceed to upload
                  }
                }}
              />
              <label
                htmlFor="cor-upload"
                className="schedule-filter-btn active"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {uploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-upload"></i>}
                {uploading ? "Processing..." : "Upload CoR"}
              </label>
            </div>
          </div>
        </div>
      )}

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