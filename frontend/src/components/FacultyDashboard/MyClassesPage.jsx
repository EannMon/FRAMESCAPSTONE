import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../Common/ToastProvider';
import { generateFramesPDF } from '../../utils/ReportGenerator';
import { formatTo12Hr } from '../../utils/timeUtils';
import './MyClassesPage.css';

const FacultyMyClassesPage = () => {
    // --- STATES ---
    const toast = useToast();
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar' | 'upload'
    const [subView, setSubView] = useState('main');   // 'main' | 'sheet' | 'profile' | 'preview'

    const [user, setUser] = useState(null);
    const [myClasses, setMyClasses] = useState([]); // Data from DB
    const [studentList, setStudentList] = useState([]); // Data from DB
    const [loading, setLoading] = useState(true);

    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Edit Student State
    const [editingStudent, setEditingStudent] = useState(null);
    const [editFormData, setEditFormData] = useState({ firstName: '', lastName: '', tupm_id: '' });

    // Calendar States
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [selectedSessions, setSelectedSessions] = useState([]);
    const [showManageModal, setShowManageModal] = useState(false);
    const [modalData, setModalData] = useState({ type: 'normal', reason: '' });

    // Day Summary Modal (past dates)
    const [dayModal, setDayModal] = useState(null); // { date, dateStr, events }

    // Upload States
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadedSchedules, setUploadedSchedules] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadMessage, setUploadMessage] = useState('');
    const [semester, setSemester] = useState('');
    const [academicYear, setAcademicYear] = useState('');
    const [ayStart, setAyStart] = useState('');
    const [ayEnd, setAyEnd] = useState('');

    // Preview States (two-step upload)
    const [previewData, setPreviewData] = useState(null); // parsed schedule data
    const [isConfirming, setIsConfirming] = useState(false);

    // Add Student Modal (for attendance sheet)
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentSearchResults, setStudentSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // --- 1. INITIAL LOAD ---
    useEffect(() => {
        const controller = new AbortController();
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchSchedule(parsedUser.user_id || parsedUser.id, controller.signal);
            fetchUploadHistory(parsedUser.user_id || parsedUser.id, controller.signal);
            // Fetch active academic year from department
            const deptId = parsedUser.department_id;
            if (deptId) {
                api.get(`/api/dept/academic-year?dept_id=${deptId}`, { signal: controller.signal })
                    .then(res => {
                        if (res.data.academic_year) setAcademicYear(res.data.academic_year);
                        if (res.data.semester) setSemester(res.data.semester);
                        if (res.data.semester_start_date) setAyStart(res.data.semester_start_date);
                        if (res.data.semester_end_date) setAyEnd(res.data.semester_end_date);
                    })
                    .catch(err => {
                        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                            console.error('Failed to fetch academic year:', err);
                        }
                    });
            } else {
                console.warn('User has no department_id — cannot fetch academic year. User role:', parsedUser.role);
            }
        }
        return () => controller.abort();
    }, []);

    // --- 2. FETCH DATA FROM DB ---
    const fetchSchedule = async (userId, signal) => {
        try {
            const response = await api.get(`/api/faculty/schedule/${userId}`, { signal });
            setMyClasses(response.data);
            setLoading(false);
        } catch (error) {
            if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
                console.error("Error loading schedule:", error);
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (myClasses.length > 0) {
            generateCalendarEvents(myClasses, currentMonth);
        }
    }, [myClasses, currentMonth, ayStart, ayEnd]);

    // --- HELPER: Calculate class status based on schedule ---
    const getClassStatus = (classData) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Days of week mapping
        const dayOfWeekMap = {
            'Sunday': 0,
            'Monday': 1,
            'Tuesday': 2,
            'Wednesday': 3,
            'Thursday': 4,
            'Friday': 5,
            'Saturday': 6
        };

        const classDay = dayOfWeekMap[classData.day_of_week];
        if (classDay === undefined) return 'no-bar'; // Invalid day

        // Find the next occurrence of this class day
        let nextClassDate = new Date(today);
        let daysUntilClass = (classDay - nextClassDate.getDay() + 7) % 7;

        if (daysUntilClass === 0) {
            // Class is today, check if it's ongoing
            const now = new Date();
            const [hour, min] = classData.start_time.split(':').map(Number);
            const classStartTime = new Date(today);
            classStartTime.setHours(hour, min, 0);

            // Assume 1 hour class duration
            const classEndTime = new Date(classStartTime);
            classEndTime.setHours(classEndTime.getHours() + 1);

            if (now >= classStartTime && now < classEndTime) {
                return 'ongoing';
            } else if (now < classStartTime) {
                return 'upcoming'; // Class is today but hasn't started yet
            } else {
                return 'no-bar'; // Class already finished
            }
        } else if (daysUntilClass > 0 && daysUntilClass <= 2) {
            // Class is within next 2 days
            return 'upcoming';
        } else {
            // Class is more than 2 days away or in the past
            return 'no-bar';
        }
    };

    const fetchUploadHistory = async (userId, signal) => {
        try {
            const response = await api.get(`/api/faculty/upload-history/${userId}`, { signal });
            setUploadedSchedules(response.data);
        } catch (error) {
            if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
                console.error("Error fetching upload history:", error);
            }
        }
    };

    const fetchClassDetails = async (cls) => {
        setLoading(true);
        setSelectedClass(cls);
        try {
            const response = await api.get(`/api/faculty/class-details/${cls.id}`);
            // Add status color logic for UI
            const processedStudents = response.data.map(s => ({
                ...s,
                statusColor: s.status === 'Present' ? 'green' : 'red'
            }));
            setStudentList(processedStudents);
            setSubView('sheet');
        } catch (error) {
            console.error("Error loading students:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- 3. CALENDAR GENERATOR (DB Schedule -> Calendar Dates) ---
    const generateCalendarEvents = (classes, targetDate) => {
        const events = [];
        const date = targetDate || new Date();
        const year = date.getFullYear();
        const month = date.getMonth(); // Current Month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Loop through every day of the month
        for (let d = 1; d <= daysInMonth; d++) {
            const currentDate = new Date(year, month, d);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            
            // Check if within academic year dates
            let isWithinAY = true;
            if (ayStart && ayEnd) {
                isWithinAY = dateStr >= ayStart && dateStr <= ayEnd;
            } else if (ayStart) {
                isWithinAY = dateStr >= ayStart;
            } else if (ayEnd) {
                isWithinAY = dateStr <= ayEnd;
            }

            if (!isWithinAY) continue; // Skip events outside the bounds

            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Monday"
            const isPast = currentDate < today;

            // Find classes that meet on this day name
            classes.forEach(cls => {
                if (cls.day_of_week === dayName) {
                    events.push({
                        id: `${cls.id}-${d}`, // Unique ID
                        date: dateStr,
                        day: d,
                        title: cls.subject_code,
                        subjectTitle: cls.subject_title || cls.subject_code,
                        time: cls.start_time,
                        endTime: cls.end_time || null,
                        formattedTime: formatTo12Hr(cls.start_time) + (cls.end_time ? ` – ${formatTo12Hr(cls.end_time)}` : ''),
                        section: cls.section,
                        room: cls.room || 'TBA',
                        status: 'normal', // Default status
                        isPast: isPast
                    });
                }
            });
        }
        setCalendarEvents(events);
    };

    // --- UPLOAD HANDLERS ---
    const handleFileSelect = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadMessage('Please select a PDF file');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setUploadMessage('Parsing schedule...');

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('faculty_id', user.user_id || user.id);

        try {
            const response = await api.post(
                '/api/faculty/parse-schedule',
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 120000, // 2 min for large PDFs
                    onUploadProgress: (progressEvent) => {
                        const pct = progressEvent.total
                            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                            : 0;
                        setUploadProgress(pct);
                    },
                }
            );

            if (response.data.success) {
                // Validate parsed schedule against dept head settings (Task 45)
                const parsedSem = response.data.semester || '';
                const parsedAy = response.data.academic_year || '';
                const mismatchParts = [];
                
                if (semester && parsedSem && parsedSem !== semester) {
                    mismatchParts.push(`Semester: file says "${parsedSem}" but department is set to "${semester}"`);
                }
                if (academicYear && parsedAy && parsedAy !== academicYear) {
                    mismatchParts.push(`Academic Year: file says "${parsedAy}" but department is set to "${academicYear}"`);
                }

                if (mismatchParts.length > 0) {
                    // DECLINE UPLOAD: If there is a mismatch, stop and show message as per Dept Head requirement
                    setUploadMessage(`❌ Please upload an updated Schedule. The academic year/semester in this PDF does not match the current official settings (${academicYear} ${semester}).`);
                    setIsUploading(false);
                    return;
                }

                // Store parsed data and switch to preview
                setPreviewData(response.data);
                if (semester) setSemester(semester);
                else if (response.data.semester) setSemester(response.data.semester);
                if (academicYear) setAcademicYear(academicYear);
                else if (response.data.academic_year) setAcademicYear(response.data.academic_year);
                setUploadMessage('');
                setSelectedFile(null);
                setSubView('preview');
            } else {
                setUploadMessage(`❌ Error: ${response.data.error?.message || response.data.error || 'Parse failed'}`);
            }
        } catch (error) {
            // Check for specific mismatch error codes from backend (Task 45/48)
            const errorData = error.response?.data?.detail?.error || error.response?.data;
            if (errorData?.code === 'AY_MISMATCH' || errorData?.code === 'SEMESTER_MISMATCH') {
                setUploadMessage(`⚠️ ${errorData.message}`);
            } else {
                setUploadMessage(`❌ ${errorData?.message || errorData?.error || error.message}`);
            }
        } finally {
            setIsUploading(false);
        }
    };

    // --- CONFIRM SCHEDULE (Step 2) ---
    const handleConfirmSchedule = async () => {
        if (!previewData) return;
        setIsConfirming(true);
        try {
            const payload = {
                faculty_id: user.user_id || user.id,
                semester: semester,
                academic_year: academicYear,
                filename: previewData.filename,
                courses: previewData.courses
            };
            const response = await api.post('/api/faculty/confirm-schedule', payload, {
                timeout: 120000, // 2 min for saving many students
            });
            toast.success(`✅ ${response.data.message}`);
            setPreviewData(null);
            setSubView('main');
            setViewMode('list');
            fetchSchedule(user.user_id || user.id);
            fetchUploadHistory(user.user_id || user.id);
        } catch (error) {
            const errorData = error.response?.data?.detail?.error || error.response?.data;
            if (errorData?.code === 'CLASS_ALREADY_CLAIMED') {
                toast.error(`⚠️ ${errorData.message}`);
            } else {
                toast.error(`❌ Failed: ${errorData?.message || errorData?.error || error.message}`);
            }
        } finally {
            setIsConfirming(false);
        }
    };

    // --- PREVIEW STUDENT MANAGEMENT ---
    const handleRemovePreviewStudent = (courseIdx, studentIdx) => {
        const updated = { ...previewData };
        updated.courses = updated.courses.map((c, ci) => {
            if (ci === courseIdx) {
                return { ...c, enrolled_students: c.enrolled_students.filter((_, si) => si !== studentIdx) };
            }
            return c;
        });
        setPreviewData(updated);
    };

    const handleAddPreviewStudent = (courseIdx, tupmId, name) => {
        if (!tupmId.trim() || !name.trim()) return;
        const updated = { ...previewData };
        updated.courses = updated.courses.map((c, ci) => {
            if (ci === courseIdx) {
                // Check if student already in list
                if (c.enrolled_students.some(s => s.tupm_id === tupmId)) {
                    toast.warning('Student already in the list');
                    return c;
                }
                return { ...c, enrolled_students: [...c.enrolled_students, { tupm_id: tupmId, name: name }] };
            }
            return c;
        });
        setPreviewData(updated);
    };

    // --- SEARCH STUDENTS (for confirmed classes) ---
    const handleSearchStudents = async (query) => {
        setStudentSearchQuery(query);
        if (query.length < 2) { setStudentSearchResults([]); return; }
        setIsSearching(true);
        try {
            const response = await api.get(`/api/faculty/search-students?q=${encodeURIComponent(query)}`);
            setStudentSearchResults(response.data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddStudentToClass = async (studentId) => {
        if (!selectedClass) return;
        try {
            await api.post(`/api/faculty/class/${selectedClass.id}/add-student`, { student_id: studentId });
            toast.success('Student added successfully!');
            setShowAddStudentModal(false);
            setStudentSearchQuery('');
            setStudentSearchResults([]);
            fetchClassDetails(selectedClass);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add student');
        }
    };

    const handleRemoveStudentFromClass = async (studentId) => {
        if (!selectedClass) return;
        const confirmed = await toast.confirm('Are you sure you want to remove this student from the class?');
        if (!confirmed) return;
        try {
            await api.delete(`/api/faculty/class/${selectedClass.id}/remove-student/${studentId}`);
            toast.success('Student removed successfully!');
            fetchClassDetails(selectedClass);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to remove student');
        }
    };

    // --- HANDLERS ---
    const handleTakeAttendance = (cls) => {
        fetchClassDetails(cls);
    };

    const handleDeleteClass = async (classId, className) => {
        if (!window.confirm(`Are you sure you want to delete the class "${className}"? All enrolled students will be preserved.`)) {
            return;
        }

        try {
            await api.delete(`/api/faculty/class/${classId}`);
            setMyClasses(prev => prev.filter(c => c.id !== classId));
            toast.success(`Class "${className}" deleted successfully`);
        } catch (error) {
            console.error("Error deleting class:", error);
            toast.error(error.response?.data?.message || 'Failed to delete class');
        }
    };

    const handleViewStudent = (student) => {
        if (editingStudent === student.user_id) return; // Prevent viewing when editing
        setSelectedStudent(student);
        setSubView('profile');
    };

    const handleEditStudentClick = (e, student) => {
        e.stopPropagation();
        setEditingStudent(student.user_id);
        setEditFormData({
            firstName: student.firstName,
            lastName: student.lastName,
            tupm_id: student.tupm_id
        });
    };

    const handleCancelEdit = (e) => {
        if (e) e.stopPropagation();
        setEditingStudent(null);
        setEditFormData({ firstName: '', lastName: '', tupm_id: '' });
    };

    const handleSaveStudentEdit = async (e, studentId) => {
        e.stopPropagation();
        try {
            await api.put(`/api/faculty/student/${studentId}`, editFormData);

            // Update local state instantly
            setStudentList(studentList.map(s => {
                if (s.user_id === studentId) {
                    return { ...s, ...editFormData };
                }
                return s;
            }));

            toast.success("Student updated successfully!");
            setEditingStudent(null);
        } catch (error) {
            console.error("Error updating student:", error);
            toast.error("Failed to update student: " + (error.response?.data?.error || error.message));
        }
    };

    const handleBack = () => {
        if (subView === 'profile') setSubView('sheet');
        else if (subView === 'sheet') {
            setSubView('main');
            setSelectedClass(null);
        } else if (subView === 'preview') {
            setSubView('main');
            setViewMode('upload');
            setPreviewData(null);
        }
    };

    const toggleSessionSelect = (id) => {
        if (selectedSessions.includes(id)) {
            setSelectedSessions(selectedSessions.filter(sid => sid !== id));
        } else {
            setSelectedSessions([...selectedSessions, id]);
        }
    };

    // Bulk Update - Now persists to database
    const handleBulkUpdate = async () => {
        // Get the actual dates for the selected sessions
        const selectedDates = selectedSessions.map(sessionId => {
            const event = calendarEvents.find(ev => ev.id === sessionId);
            return event ? event.date : null;
        }).filter(d => d !== null);

        if (selectedDates.length === 0) {
            toast.warning("No valid sessions selected");
            return;
        }

        // Determine the class_id from the first selected session
        const firstSelected = calendarEvents.find(ev => selectedSessions.includes(ev.id));
        if (!firstSelected) {
            toast.warning("Could not determine class");
            return;
        }

        // Extract class_id from session id (format: "class_id-day")
        const classId = parseInt(firstSelected.id.split('-')[0]);

        try {
            await api.post('/api/faculty/session-exceptions', {
                class_id: classId,
                session_dates: selectedDates,
                exception_type: modalData.type === 'normal' ? 'onsite' :
                    modalData.type === 'online-sync' ? 'online' : modalData.type,
                reason: modalData.reason || null
            });

            // Update visual state
            const updatedEvents = calendarEvents.map(ev => {
                if (selectedSessions.includes(ev.id)) {
                    return { ...ev, status: modalData.type, reason: modalData.reason };
                }
                return ev;
            });
            setCalendarEvents(updatedEvents);
            setShowManageModal(false);
            setSelectedSessions([]);
            toast.success("Schedule updated and saved to database!");
        } catch (error) {
            console.error("Error saving session exceptions:", error);
            toast.error("Failed to save changes: " + (error.response?.data?.detail || error.message));
        }
    };

    // --- PAST-DAY CLICK HANDLER ---
    const handlePastDayClick = (day) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const events = calendarEvents.filter(ev => ev.date === dateStr);
        if (events.length === 0) return;
        setDayModal({ dateStr, day, events });
    };

    const handleDayModalPDF = () => {
        if (!dayModal) return;
        const dateLabel = new Date(dayModal.dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const reportInfo = {
            title: `Daily Session Summary — ${dateLabel}`,
            type: 'FACULTY DAILY SUMMARY',
            category: 'schedule',
            context: {
                name: `${user?.first_name || user?.firstName} ${user?.last_name || user?.lastName}`,
                department: 'Assigned Classes',
            },
            dateRange: dateLabel,
        };
        const tableData = dayModal.events.map(ev => ({
            'Subject Code': ev.title,
            'Section': ev.section,
            'Time': ev.time,
            'Status': ev.status === 'cancelled' ? 'CANCELLED' : 'COMPLETED',
        }));
        generateFramesPDF(reportInfo, tableData);
    };

    // --- PDF GENERATORS (Using FRAMES ReportGenerator) ---
    const generateClassPDF = () => {
        const reportInfo = {
            title: `${selectedClass.subject_title} Attendance`,
            type: "CLASS ATTENDANCE REPORT",
            category: 'class',
            context: {
                classCode: selectedClass.subject_code,
                section: selectedClass.section
            },
            dateRange: new Date().toLocaleDateString()
        };

        const tableData = studentList.map(s => ({
            "Student Name": `${s.lastName}, ${s.firstName}`,
            "Student ID": s.tupm_id,
            "Time In": s.timeIn,
            "Status": s.status
        }));

        generateFramesPDF(reportInfo, tableData);
    };

    const generateStudentPDF = () => {
        const reportInfo = {
            title: "Individual Attendance Report",
            type: "STUDENT REPORT",
            category: 'personal',
            context: {
                name: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
                id: selectedStudent.tupm_id
            },
            dateRange: new Date().toLocaleDateString()
        };

        const tableData = [{
            "Date": new Date().toLocaleDateString(),
            "Subject": selectedClass.subject_title,
            "Time In": selectedStudent.timeIn,
            "Status": selectedStudent.status
        }];

        generateFramesPDF(reportInfo, tableData);
    };

    const generateMonthlyPDF = () => {
        const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        const reportInfo = {
            title: `Monthly Schedule - ${monthName}`,
            type: "FACULTY SCHEDULE",
            category: 'schedule',
            context: {
                name: `${user.first_name || user.firstName} ${user.last_name || user.lastName}`,
                department: "Assigned Classes"
            },
            dateRange: monthName
        };

        const sortedEvents = [...calendarEvents].sort((a, b) => new Date(a.date) - new Date(b.date));

        const tableData = sortedEvents.map(ev => ({
            "Date": new Date(ev.date).toLocaleDateString(),
            "Time": ev.time,
            "Subject": ev.title,
            "Section": ev.section,
            "Status": ev.status.toUpperCase()
        }));

        generateFramesPDF(reportInfo, tableData);
    };

    // --- RENDERERS ---

    // A. LIST VIEW (Cards)
    const renderClassCards = () => (
        <div className="faculty-classes-grid fade-in">
            {myClasses.length > 0 ? (
                myClasses.map((cls) => {
                    const classStatus = getClassStatus(cls);
                    const shouldShowBadge = classStatus !== 'no-bar';
                    
                    return (
                        <div key={cls.id} className={`card faculty-class-card ${classStatus === 'ongoing' ? 'today-active' : ''}`}>
                            {shouldShowBadge && (
                                <div className="card-status-badge">
                                    {classStatus === 'ongoing' ? <span className="badge-today">Ongoing</span> : <span className="badge-upcoming">Upcoming</span>}
                                </div>
                            )}
                            <div className="faculty-class-header">
                                <h3>{cls.subject_title}</h3>
                                <span className="faculty-class-code">{cls.subject_code}</span>
                            </div>
                            <div className="faculty-class-details">
                                <div className="detail-row"><i className="fas fa-clock"></i> {cls.day_of_week} {formatTo12Hr(cls.start_time)}</div>
                                <div className="detail-row"><i className="fas fa-map-marker-alt"></i> {cls.room || 'TBA'}</div>
                                <div className="detail-row"><i className="fas fa-users"></i> {cls.section} ({cls.total_students})</div>
                            </div>

                            <div className="attendance-preview-bar">
                                <div className="bar-label"><span>Avg. Attendance</span><span className="green">{cls.rate}%</span></div>
                                <div className="progress-track">
                                    <div className="progress-fill green" style={{ width: `${cls.rate}%` }}></div>
                                </div>
                            </div>

                            <div className="action-area">
                                <button className="faculty-take-attendance-btn" onClick={() => handleTakeAttendance(cls)}>
                                    <i className="fas fa-user-check"></i> View Class
                                </button>
                                <button 
                                    className="faculty-delete-class-btn" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClass(cls.id, `${cls.subject_code} - ${cls.section}`);
                                    }}
                                    title="Delete Class"
                                >
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="no-classes-message">
                    {loading ? "Loading classes..." : "No classes assigned."}
                </div>
            )}
        </div>
    );

    // B. ATTENDANCE SHEET VIEW
    const renderAttendanceSheet = () => (
        <div className="attendance-sheet-container fade-in">
            <div className="sheet-header">
                <button className="back-btn" onClick={handleBack}><i className="fas fa-arrow-left"></i> Back to Classes</button>
                <div className="class-info-header">
                    <h2>{selectedClass.subject_title} <span className="highlight-code">({selectedClass.subject_code})</span></h2>
                    <p>{selectedClass.section} • {selectedClass.room}</p>
                </div>
            </div>
            <div className="sheet-controls">
                <div className="search-wrapper">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search student..." onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="export-pdf-btn" onClick={() => setShowAddStudentModal(true)} style={{ background: '#2E7D32', color: 'white' }}>
                        <i className="fas fa-user-plus"></i> Add Student
                    </button>
                    <button className="export-pdf-btn" onClick={generateClassPDF}><i className="fas fa-download"></i> Export List</button>
                </div>
            </div>
            <div className="students-list-wrapper">
                <table className="styled-table">
                    <thead><tr><th>Student Info</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                    <tbody>
                        {studentList
                            .filter(s =>
                                (s.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (s.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (s.tupm_id || '').includes(searchTerm)
                            )
                            .map(s => (
                                <tr key={s.user_id} onClick={() => handleViewStudent(s)} className={`clickable-row ${editingStudent === s.user_id ? 'editing-row' : ''}`}>
                                    <td className="student-name-cell" style={{ minWidth: '300px' }}>
                                        <div className="avatar-placeholder">{(s.firstName || '?').charAt(0)}</div>
                                        {editingStudent === s.user_id ? (
                                            <div className="edit-student-inline-form" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="text"
                                                    value={editFormData.lastName}
                                                    onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })}
                                                    placeholder="Last Name"
                                                />
                                                <input
                                                    type="text"
                                                    value={editFormData.firstName}
                                                    onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })}
                                                    placeholder="First Name"
                                                />
                                            </div>
                                        ) : (
                                            <div><div className="s-name">{s.lastName}, {s.firstName}</div><div className="s-id">{s.tupm_id}</div></div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {editingStudent === s.user_id ? (
                                            <div className="edit-actions" onClick={e => e.stopPropagation()}>
                                                <button className="save-icon-btn" onClick={(e) => handleSaveStudentEdit(e, s.user_id)} title="Save"><i className="fas fa-check"></i></button>
                                                <button className="cancel-icon-btn" onClick={handleCancelEdit} title="Cancel"><i className="fas fa-times"></i></button>
                                            </div>
                                        ) : (
                                            <div className="student-row-actions">
                                                <button className="icon-btn-edit" onClick={(e) => handleEditStudentClick(e, s)} title="Edit Student"><i className="fas fa-edit"></i></button>
                                                <button className="icon-btn-remove" onClick={(e) => { e.stopPropagation(); handleRemoveStudentFromClass(s.user_id); }} title="Remove Student"><i className="fas fa-trash-alt"></i></button>
                                                <button className="icon-btn-view" title="View Profile"><i className="fas fa-chevron-right"></i></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        {studentList.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No students found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // C. STUDENT PROFILE VIEW
    const renderStudentProfile = () => (
        <div className="student-profile-container fade-in">
            <button className="back-btn" onClick={handleBack}><i className="fas fa-arrow-left"></i> Back to List</button>
            <div className="student-profile-card card">
                <div className="profile-header-row">
                    <div className="big-avatar">{(selectedStudent.firstName || '?').charAt(0)}</div>
                    <div className="profile-info">
                        <h2>{selectedStudent.lastName}, {selectedStudent.firstName}</h2>
                        <span className="profile-student-id">{selectedStudent.tupm_id}</span>
                        <div className="profile-badge-row">
                            <span className="profile-type-badge">Student</span>
                            <span className="profile-dept-badge">{selectedClass.section}</span>
                        </div>
                    </div>
                </div>
                
                <div className="profile-details-section">
                    <h4>Student Information</h4>
                    <div className="profile-details-grid">
                        <div className="p-detail-item">
                            <label><i className="fas fa-user"></i> Full Name</label>
                            <div className="p-detail-value">{selectedStudent.firstName} {selectedStudent.lastName}</div>
                        </div>
                        <div className="p-detail-item">
                            <label><i className="fas fa-id-card"></i> Student ID</label>
                            <div className="p-detail-value">{selectedStudent.tupm_id}</div>
                        </div>
                        <div className="p-detail-item">
                            <label><i className="fas fa-book"></i> Enrolled Class</label>
                            <div className="p-detail-value">{selectedClass.subject_title} ({selectedClass.subject_code})</div>
                        </div>
                        <div className="p-detail-item">
                            <label><i className="fas fa-users"></i> Section</label>
                            <div className="p-detail-value">{selectedClass.section}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // D. CALENDAR VIEW
    const renderCalendarView = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = new Date(year, month, 1).getDay();
        const calendarCells = [];

        for (let i = 0; i < startDay; i++) {
            calendarCells.push(<div key={`empty-${i}`} className="cal-cell empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const events = calendarEvents.filter(s => s.date === dateStr);

            // Past Date Summary Hook
            const isPast = new Date(year, month, day) < new Date(new Date().setHours(0, 0, 0, 0));
            const completedCount = events.length;

            calendarCells.push(
                <div
                    key={day}
                    className={`cal-cell day ${isPast ? 'past-day' : ''} ${isPast && completedCount > 0 ? 'past-clickable' : ''}`}
                    onClick={() => { if (isPast && completedCount > 0) handlePastDayClick(day); }}
                    title={isPast && completedCount > 0 ? 'Click to view session summary' : undefined}
                >
                    <div className="cal-day-header">
                        <span className="cal-day-number">{day}</span>
                        {isPast && completedCount > 0 && (
                            <span className="past-summary-badge" title={`${completedCount} sessions`}>
                                <i className="fas fa-check-circle"></i> {completedCount}
                            </span>
                        )}
                    </div>
                    <div className="cal-events-stack">
                        {events.map(ev => (
                            <div
                                key={ev.id}
                                className={`cal-event-pill cal-event-pill-enhanced ${ev.status === 'cancelled' ? 'cal-event-red' : (ev.isPast ? 'cal-event-green' : 'cal-event-blue')} ${selectedSessions.includes(ev.id) ? 'selected-pill' : ''}`}
                                onClick={(e) => {
                                    if (ev.isPast) { e.stopPropagation(); return; }
                                    e.stopPropagation();
                                    toggleSessionSelect(ev.id);
                                }}
                                title={ev.isPast ? `${ev.subjectTitle || ev.title} — Completed` : `${ev.subjectTitle || ev.title} — Click to Select`}
                            >
                                <div className="cal-pill-main-row">
                                    {ev.isPast && <i className="fas fa-check pill-check"></i>}
                                    {!ev.isPast && selectedSessions.includes(ev.id) && <i className="fas fa-check-circle pill-check"></i>}
                                    <span className="cal-pill-subject">{ev.subjectTitle || ev.title}</span>
                                </div>
                                <div className="cal-pill-details">
                                    <span>{ev.formattedTime || formatTo12Hr(ev.time)}</span>
                                    <span className="cal-pill-sep">·</span>
                                    <span>{ev.section}</span>
                                    <span className="cal-pill-sep">·</span>
                                    <span>{ev.room || 'TBA'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="schedule-view-container fade-in">
                {/* MATCHED STUDENT SCHEDULE HEADER STYLE */}
                <div className="schedule-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button className="schedule-filter-btn" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <h2 style={{ minWidth: '180px', textAlign: 'center' }}>
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button className="schedule-filter-btn" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    <div className="schedule-filters">
                        <button className="schedule-filter-btn active" onClick={generateMonthlyPDF}>
                            <i className="fas fa-file-pdf"></i> Download Month
                        </button>
                        {selectedSessions.length > 0 && (
                            <button className="schedule-filter-btn schedule-filter-btn-warning" onClick={() => setShowManageModal(true)}>
                                Update {selectedSessions.length} Selected
                            </button>
                        )}
                    </div>
                </div>

                <div className="calendar-grid-wrapper calendar-grid-card">
                    <div className="cal-header-row">
                        <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
                    </div>
                    <div className="cal-body-grid">{calendarCells}</div>
                </div>
            </div>
        );
    };

    // E. UPLOAD VIEW
    const renderUploadView = () => (
        <div className="upload-container fade-in">
            <div className="upload-section card">
                <h3><i className="fas fa-book" style={{ marginRight: '8px' }}></i>Upload Course Schedule (PDF)</h3>
                <p className="info-text">
                    Upload your Schedule PDF to automatically create courses and enroll students
                </p>

                <div className="form-group">
                    <label>Select PDF File:</label>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Semester:</label>
                        <div className="locked-field">
                            <i className="fas fa-lock"></i>
                            <span>{semester || 'Not set by Dept Head'}</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Academic Year:</label>
                        <div className="locked-field">
                            <i className="fas fa-lock"></i>
                            <span>{academicYear || 'Not set by Dept Head'}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="upload-btn"
                >
                    {isUploading
                        ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i> Parsing... {uploadProgress}%</>
                        : <><i className="fas fa-file-upload" style={{ marginRight: 6 }}></i> Upload &amp; Preview</>}
                </button>

                {uploadMessage && (
                    <div className={`message ${uploadMessage.includes('✅') ? 'success' : 'error'}`}>
                        {uploadMessage}
                    </div>
                )}
            </div>

            {/* Upload History Section */}
            <div className="history-section card">
                <h3>📋 Upload History</h3>
                {uploadedSchedules.length === 0 ? (
                    <p className="no-data">No schedules uploaded yet</p>
                ) : (
                    <div className="history-list">
                        {uploadedSchedules.map((upload) => (
                            <div key={upload.id || upload.upload_id} className="history-item">
                                <div className="history-file-info">
                                    <div className="file-icon-box">
                                        <i className="fas fa-file-pdf"></i>
                                    </div>
                                    <div className="file-details">
                                        <span className="file-name">{upload.filename || upload.file_name}</span>
                                        <div className="file-meta">
                                            <span>{upload.semester}</span>
                                            <span className="meta-separator">•</span>
                                            <span>{upload.academic_year}</span>
                                            <span className="meta-separator">•</span>
                                            <span className="schedules-count">
                                                {upload.schedules_created !== undefined ? upload.schedules_created + upload.schedules_updated : upload.schedules_count} Schedules
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="history-status-info">
                                    <span className={`status-pill ${(upload.status || 'Success').toLowerCase()}`}>
                                        {upload.status || 'Success'}
                                    </span>
                                    <span className="upload-date">
                                        {new Date(upload.timestamp || upload.uploaded_at).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // F. PREVIEW VIEW (after PDF parse, before confirm)
    const renderPreviewView = () => {
        if (!previewData) return null;
        return (
            <div className="preview-container fade-in">
                <button className="back-btn" onClick={handleBack}><i className="fas fa-arrow-left"></i> Back to Upload</button>
                <div className="preview-header card">
                    <h3><i className="fas fa-eye"></i> Schedule Preview</h3>
                    <p className="info-text">Review the parsed schedule below. You can <strong>add or remove students</strong> before confirming. Class details (subject, time, room) are read-only.</p>
                    <div className="preview-meta">
                        <span><i className="fas fa-calendar"></i> {semester}</span>
                        <span><i className="fas fa-graduation-cap"></i> A.Y. {academicYear}</span>
                        <span><i className="fas fa-file-pdf"></i> {previewData.filename}</span>
                    </div>
                </div>

                {previewData.courses.map((course, courseIdx) => (
                    <div key={courseIdx} className="preview-course-card card">
                        <div className="preview-course-header">
                            <div>
                                <h4>{course.subject_code} — {course.subject_name}</h4>
                                <p className="preview-detail-row">
                                    <span><i className="fas fa-calendar-day"></i> {course.day}</span>
                                    <span><i className="fas fa-clock"></i> {formatTo12Hr(course.start_time)} - {formatTo12Hr(course.end_time)}</span>
                                    <span><i className="fas fa-users"></i> {course.section}</span>
                                    <span><i className="fas fa-map-marker-alt"></i> {course.venue}</span>
                                </p>
                            </div>
                            <div className="preview-student-count">
                                <span className="count-badge">{course.enrolled_students.length}</span>
                                <span>students</span>
                            </div>
                        </div>

                        <div className="preview-students-table">
                            <table className="styled-table">
                                <thead>
                                    <tr><th>#</th><th>TUPM ID</th><th>Name</th><th style={{ width: '60px' }}>Remove</th></tr>
                                </thead>
                                <tbody>
                                    {course.enrolled_students.map((student, sIdx) => (
                                        <tr key={sIdx}>
                                            <td>{sIdx + 1}</td>
                                            <td><strong>{student.tupm_id}</strong></td>
                                            <td>{student.name}</td>
                                            <td>
                                                <button className="icon-btn-remove" onClick={() => handleRemovePreviewStudent(courseIdx, sIdx)} title="Remove">
                                                    <i className="fas fa-times-circle"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {course.enrolled_students.length === 0 && (
                                        <tr><td colSpan="4" className="td-empty-state">No students. Add manually below.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="preview-add-student-row">
                            <input type="text" id={`add-tupm-${courseIdx}`} placeholder="TUPM ID (e.g. TUPM-21-1234)" />
                            <input type="text" id={`add-name-${courseIdx}`} placeholder="Name (Last, First)" />
                            <button className="add-preview-btn" onClick={() => {
                                const tupmInput = document.getElementById(`add-tupm-${courseIdx}`);
                                const nameInput = document.getElementById(`add-name-${courseIdx}`);
                                handleAddPreviewStudent(courseIdx, tupmInput.value, nameInput.value);
                                tupmInput.value = '';
                                nameInput.value = '';
                            }}>
                                <i className="fas fa-plus"></i> Add Student
                            </button>
                        </div>
                    </div>
                ))}

                <div className="preview-action-bar">
                    <button className="cancel-btn" onClick={handleBack} disabled={isConfirming}>Cancel</button>
                    <button className="save-btn" onClick={handleConfirmSchedule} disabled={isConfirming}>
                        {isConfirming ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> Confirm & Save Schedule</>}
                    </button>
                </div>
            </div>
        );
    };

    if (!user) return <div className="loading">Please log in.</div>;

    return (
        <div className="faculty-my-classes-container">
            {subView === 'main' && (
                <div className="view-toggle-header">
                    <div className="toggle-buttons">
                        <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                            <i className="fas fa-list"></i> List
                        </button>
                        <button className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>
                            <i className="fas fa-calendar-alt"></i> Calendar
                        </button>
                        <button className={`toggle-btn ${viewMode === 'upload' ? 'active' : ''}`} onClick={() => setViewMode('upload')}>
                            <i className="fas fa-cloud-upload-alt"></i> Upload
                        </button>
                    </div>
                </div>
            )}

            {subView === 'main' ? (
                viewMode === 'list' ? renderClassCards() : viewMode === 'calendar' ? renderCalendarView() : renderUploadView()
            ) : subView === 'sheet' ? (
                renderAttendanceSheet()
            ) : subView === 'preview' ? (
                renderPreviewView()
            ) : (
                renderStudentProfile()
            )}

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

            {/* ── DAY SUMMARY MODAL (Past Date Click) ── */}
            {dayModal && (
                <div className="modal-overlay" onClick={() => setDayModal(null)}>
                    <div className="modal-content-box manage-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title-no-margin">
                                    <i className="fas fa-calendar-check modal-icon-green"></i>
                                    Session Summary
                                </h3>
                                <p className="modal-subtitle">
                                    {new Date(dayModal.dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <button className="close-btn" onClick={() => setDayModal(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <table className="session-summary-table">
                                <thead>
                                    <tr className="session-summary-header-row">
                                        <th className="session-summary-th">Subject</th>
                                        <th className="session-summary-th">Section</th>
                                        <th className="session-summary-th">Room</th>
                                        <th className="session-summary-th">Time</th>
                                        <th className="session-summary-th">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dayModal.events.map((ev, i) => (
                                        <tr key={i} className="session-summary-row">
                                            <td className="session-summary-td-title">
                                                <div>{ev.subjectTitle || ev.title}</div>
                                                <div style={{ fontSize: '0.75em', color: '#64748b', marginTop: '2px' }}>{ev.title}</div>
                                            </td>
                                            <td className="session-summary-td">{ev.section}</td>
                                            <td className="session-summary-td">{ev.room || 'TBA'}</td>
                                            <td className="session-summary-td">{ev.formattedTime || formatTo12Hr(ev.time)}</td>
                                            <td className="session-summary-td-status">
                                                <span className={`status-badge ${ev.status === 'cancelled' ? 'status-cancelled' : 'status-completed'}`}>
                                                    {ev.status === 'cancelled' ? 'CANCELLED' : 'COMPLETED'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setDayModal(null)}>Close</button>
                            <button className="save-btn" onClick={handleDayModalPDF}>
                                <i className="fas fa-file-pdf btn-icon"></i> Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ADD STUDENT MODAL (for confirmed classes) ── */}
            {showAddStudentModal && (
                <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
                    <div className="modal-content-box manage-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><i className="fas fa-user-plus modal-icon-green"></i> Add Student to Class</h3>
                            <button className="close-btn" onClick={() => setShowAddStudentModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Search Student (by Name or TUPM ID)</label>
                                <input
                                    type="text"
                                    value={studentSearchQuery}
                                    onChange={(e) => handleSearchStudents(e.target.value)}
                                    placeholder="Type at least 2 characters..."
                                    autoFocus
                                />
                            </div>
                            {isSearching && <p className="search-status-text">Searching...</p>}
                            {studentSearchResults.length > 0 && (
                                <div className="search-results-list">
                                    {studentSearchResults.map(s => (
                                        <div key={s.id} className="search-result-item" onClick={() => handleAddStudentToClass(s.id)}>
                                            <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{(s.first_name || '?').charAt(0)}</div>
                                            <div>
                                                <div className="s-name">{s.last_name}, {s.first_name}</div>
                                                <div className="s-id">{s.tupm_id}</div>
                                            </div>
                                            <button className="add-search-btn"><i className="fas fa-plus"></i></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {studentSearchQuery.length >= 2 && studentSearchResults.length === 0 && !isSearching && (
                                <p className="search-empty-text">No students found.</p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowAddStudentModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyMyClassesPage;