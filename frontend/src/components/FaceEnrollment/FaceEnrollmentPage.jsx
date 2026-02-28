import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './FaceEnrollmentPage.css';

const FaceEnrollmentPage = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const captureIntervalRef = useRef(null);
    const phaseTimeoutRef = useRef(null);

    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedFrames, setCapturedFrames] = useState([]);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('Initializing camera...');
    const [cameraReady, setCameraReady] = useState(false);

    const REQUIRED_FRAMES = 15;
    const CAPTURE_INTERVAL = 500; // ms between captures

    // Get user from AuthContext
    const { user, updateUser } = useAuth();

    // Start webcam
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                    }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                    setCameraReady(true);
                    setStatus('Camera ready. Click "Start Capture" to begin.');
                }
            } catch (err) {
                console.error('Camera error:', err);
                setError('Failed to access camera. Please allow camera permissions.');
            }
        };

        startCamera();

        // Cleanup: camera stream + any active capture interval + enrollment phase timeout
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (captureIntervalRef.current) {
                clearInterval(captureIntervalRef.current);
            }
            if (phaseTimeoutRef.current) {
                clearTimeout(phaseTimeoutRef.current);
            }
        };
    }, []);

    // Capture a single frame
    const captureFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Mirror the image (for natural selfie view)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

        return canvas.toDataURL('image/jpeg', 0.8);
    }, []);

    // Start automatic capture
    const startCapture = () => {
        if (!cameraReady) {
            setError('Camera not ready');
            return;
        }

        setIsCapturing(true);
        setCapturedFrames([]);
        setError('');
        setStatus(`Capturing frames... (0/${REQUIRED_FRAMES})`);

        let frameCount = 0;
        const frames = [];

        captureIntervalRef.current = setInterval(() => {
            const frame = captureFrame();

            if (frame) {
                frames.push(frame);
                frameCount++;
                setStatus(`Capturing frames... (${frameCount}/${REQUIRED_FRAMES})`);
                setCapturedFrames([...frames]);

                if (frameCount >= REQUIRED_FRAMES) {
                    clearInterval(captureIntervalRef.current);
                    captureIntervalRef.current = null;
                    setIsCapturing(false);
                    setStatus('Capture complete! Click "Enroll Face" to save.');
                }
            }
        }, CAPTURE_INTERVAL);
    };

    // Submit enrollment with progress phases
    const enrollFace = async () => {
        if (capturedFrames.length < 5) {
            setError('Not enough frames captured. Please try again.');
            return;
        }

        // Check if user is logged in
        const userId = user.id || user.user_id;
        if (!userId) {
            setError('User not found. Please log in again.');
            navigate('/');
            return;
        }

        setIsEnrolling(true);
        setError('');

        // Simulated progress phases while backend processes
        const phases = [
            { msg: '⏳ Uploading frames...', duration: 1000 },
            { msg: '🧠 Loading AI model...', duration: 2000 },
            { msg: '🔍 Detecting faces...', duration: 3000 },
            { msg: '📐 Extracting features...', duration: 5000 },
            { msg: '💾 Saving to database...', duration: 2000 },
        ];

        let currentPhase = 0;

        const updatePhase = () => {
            if (currentPhase < phases.length) {
                setStatus(phases[currentPhase].msg);
                phaseTimeoutRef.current = setTimeout(() => {
                    currentPhase++;
                    updatePhase();
                }, phases[currentPhase].duration);
            }
        };

        // Start phase animation
        updatePhase();

        try {
            const response = await api.post('/api/face/enroll', {
                user_id: userId,
                frames: capturedFrames
            });

            // Clear phase animation
            clearTimeout(phaseTimeoutRef.current);

            if (response.data.success) {
                setStatus(`✅ Successfully enrolled! Quality: ${(response.data.quality_score * 100).toFixed(0)}%`);

                // Update user in AuthContext
                updateUser({ face_registered: true });

                // Redirect based on role
                setTimeout(() => {
                    const role = user.role?.toLowerCase();
                    if (role === 'student') {
                        navigate('/student-dashboard');
                    } else if (role === 'faculty' || role === 'head') {
                        navigate('/faculty-dashboard');
                    } else if (role === 'admin') {
                        navigate('/admin-dashboard');
                    } else {
                        navigate('/');
                    }
                }, 2000);
            } else {
                setError(response.data.message || 'Enrollment failed');
            }
        } catch (err) {
            clearTimeout(phaseTimeoutRef.current);
            console.error('Enrollment error:', err);
            setError(err.userMessage || 'Enrollment failed. Please try again.');
        } finally {
            setIsEnrolling(false);
        }
    };

    // Reset capture
    const resetCapture = () => {
        setCapturedFrames([]);
        setError('');
        setStatus('Camera ready. Click "Start Capture" to begin.');
    };

    return (
        <div className="face-enrollment-page">
            <div className="enrollment-container">
                <div className="enrollment-header">
                    <h1>🔐 Face Enrollment</h1>
                    <p>Please register your face to access the system</p>
                </div>

                <div className="camera-section">
                    <div className="video-container">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="camera-feed"
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                        {isCapturing && (
                            <div className="capture-overlay">
                                <div className="capture-indicator">
                                    📸 Capturing...
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${(capturedFrames.length / REQUIRED_FRAMES) * 100}%` }}
                        />
                    </div>

                    <p className="status-text">{status}</p>

                    {error && <p className="error-text">❌ {error}</p>}
                </div>

                <div className="controls-section">
                    {capturedFrames.length === 0 && !isCapturing && (
                        <button
                            className="btn-primary"
                            onClick={startCapture}
                            disabled={!cameraReady}
                        >
                            📸 Start Capture
                        </button>
                    )}

                    {isCapturing && (
                        <button className="btn-secondary" disabled>
                            Capturing... ({capturedFrames.length}/{REQUIRED_FRAMES})
                        </button>
                    )}

                    {capturedFrames.length >= REQUIRED_FRAMES && !isEnrolling && (
                        <>
                            <button className="btn-primary" onClick={enrollFace}>
                                ✅ Enroll Face
                            </button>
                            <button className="btn-secondary" onClick={resetCapture}>
                                🔄 Retake
                            </button>
                        </>
                    )}

                    {isEnrolling && (
                        <button className="btn-primary" disabled>
                            ⏳ Processing...
                        </button>
                    )}
                </div>

                <div className="tips-section">
                    <h3>Tips for best results:</h3>
                    <ul>
                        <li>Ensure good lighting on your face</li>
                        <li>Look directly at the camera</li>
                        <li>Keep your face centered in the frame</li>
                        <li>Remove glasses if possible</li>
                        <li>Move your head slightly during capture</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default FaceEnrollmentPage;
