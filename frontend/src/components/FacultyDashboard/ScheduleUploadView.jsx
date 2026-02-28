import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * ScheduleUploadView — COR PDF upload form + upload history table.
 * Extracted from MyClassesPage to satisfy the 300-line rule.
 *
 * @param {Object}   props
 * @param {Object}   props.user          - Authenticated user object
 * @param {Function} props.onUploadComplete - Called after a successful upload so parent can refresh schedule
 */
const ScheduleUploadView = ({ user, onUploadComplete }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadedSchedules, setUploadedSchedules] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const [semester, setSemester] = useState('1st Semester');
    const [academicYear, setAcademicYear] = useState('2024-2025');

    // Fetch upload history on mount
    useEffect(() => {
        const controller = new AbortController();

        if (user) {
            fetchUploadHistory(user.user_id || user.id, controller.signal);
        }

        return () => controller.abort();
    }, [user]);

    const fetchUploadHistory = async (userId, signal) => {
        try {
            const response = await api.get(`/api/faculty/upload-history/${userId}`, { signal });
            setUploadedSchedules(response.data);
        } catch (error) {
            if (error.code === 'ERR_CANCELED') return;
            console.error("Error fetching upload history:", error);
        }
    };

    const handleFileSelect = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadMessage('Please select a PDF file');
            return;
        }

        setIsUploading(true);
        setUploadMessage('Uploading and processing schedule...');

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('faculty_id', user.user_id || user.id);
        formData.append('semester', semester);
        formData.append('academic_year', academicYear);

        try {
            const response = await api.post('/api/faculty/upload-schedule', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.status === 201 || response.status === 200) {
                setUploadMessage(
                    `✅ Success! Created ${response.data.schedules_created} schedule(s) and ${response.data.students_created} student account(s)`
                );
                setSelectedFile(null);
                fetchUploadHistory(user.user_id || user.id);
                onUploadComplete?.(); // Notify parent to refresh schedule
                setTimeout(() => setUploadMessage(''), 5000);
            } else {
                setUploadMessage(`❌ Error: ${response.data.error}`);
            }
        } catch (error) {
            setUploadMessage(`❌ Upload failed: ${error.userMessage || error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="upload-container fade-in">
            <div className="upload-section card">
                <h3>📚 Upload Course Schedule (PDF)</h3>
                <p className="info-text">
                    Upload your COR/Schedule PDF to automatically create courses and enroll students
                </p>

                <div className="form-group">
                    <label>Select PDF File:</label>
                    <input type="file" accept=".pdf" onChange={handleFileSelect} disabled={isUploading} />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Semester:</label>
                        <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                            <option>1st Semester</option>
                            <option>2nd Semester</option>
                            <option>Summer</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Academic Year:</label>
                        <input
                            type="text"
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            placeholder="2024-2025"
                        />
                    </div>
                </div>

                <button onClick={handleUpload} disabled={isUploading} className="upload-btn">
                    {isUploading ? '⏳ Processing...' : '📤 Upload Schedule'}
                </button>

                {uploadMessage && (
                    <div className={`message ${uploadMessage.includes('✅') ? 'success' : 'error'}`}>
                        {uploadMessage}
                    </div>
                )}
            </div>

            {/* Upload History */}
            <div className="history-section card">
                <h3>📋 Upload History</h3>
                {uploadedSchedules.length === 0 ? (
                    <p className="no-data">No schedules uploaded yet</p>
                ) : (
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Semester</th>
                                <th>Academic Year</th>
                                <th>Schedules</th>
                                <th>Status</th>
                                <th>Uploaded</th>
                            </tr>
                        </thead>
                        <tbody>
                            {uploadedSchedules.map((upload) => (
                                <tr key={upload.upload_id}>
                                    <td>{upload.file_name}</td>
                                    <td>{upload.semester}</td>
                                    <td>{upload.academic_year}</td>
                                    <td>{upload.schedules_count}</td>
                                    <td>
                                        <span className={`status ${upload.status.toLowerCase()}`}>
                                            {upload.status}
                                        </span>
                                    </td>
                                    <td>{new Date(upload.uploaded_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ScheduleUploadView;
