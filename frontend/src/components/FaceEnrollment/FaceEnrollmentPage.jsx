import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Logo from '../Common/Logo';
import './FaceEnrollmentPage.css';

const FaceEnrollmentPage = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const streamRef = useRef(null);
    const detectorRef = useRef(null);
    const detectLoopRef = useRef(null);

    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedFrames, setCapturedFrames] = useState([]);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('Initializing camera...');
    const [cameraReady, setCameraReady] = useState(false);
    const [lastAttemptFailed, setLastAttemptFailed] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);

    const REQUIRED_FRAMES = 15;
    const CAPTURE_INTERVAL = 500; // ms between captures

    // Draw face bounding box on overlay canvas
    const drawFaceOverlay = useCallback((faces) => {
        const overlay = overlayCanvasRef.current;
        const video = videoRef.current;
        if (!overlay || !video) return;

        const ctx = overlay.getContext('2d');
        overlay.width = video.videoWidth || 640;
        overlay.height = video.videoHeight || 480;
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (faces.length > 0) {
            setFaceDetected(true);
            faces.forEach((face) => {
                const box = face.boundingBox;
                // Mirror the x coordinate since the video is flipped
                const mirroredX = overlay.width - box.x - box.width;

                // Green bounding box
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#22c55e';
                ctx.shadowBlur = 8;
                ctx.strokeRect(mirroredX, box.y, box.width, box.height);

                // Corner accents for a modern look
                ctx.shadowBlur = 0;
                const cornerLen = 18;
                const corners = [
                    [mirroredX, box.y], // top-left
                    [mirroredX + box.width, box.y], // top-right
                    [mirroredX, box.y + box.height], // bottom-left
                    [mirroredX + box.width, box.y + box.height], // bottom-right
                ];
                ctx.strokeStyle = '#4ade80';
                ctx.lineWidth = 4;
                corners.forEach(([cx, cy], i) => {
                    ctx.beginPath();
                    const dx = (i % 2 === 0) ? cornerLen : -cornerLen;
                    const dy = (i < 2) ? cornerLen : -cornerLen;
                    ctx.moveTo(cx + dx, cy);
                    ctx.lineTo(cx, cy);
                    ctx.lineTo(cx, cy + dy);
                    ctx.stroke();
                });

                // "Face Detected" label
                ctx.fillStyle = 'rgba(34, 197, 94, 0.85)';
                const labelH = 26;
                const labelW = 120;
                ctx.fillRect(mirroredX, box.y - labelH - 4, labelW, labelH);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText('Face Detected', mirroredX + 8, box.y - 10);
            });
        } else {
            setFaceDetected(false);
        }
    }, []);

    // Run face detection loop using browser's FaceDetector API
    const startFaceDetectionLoop = useCallback(async () => {
        // Check browser support for FaceDetector API
        if (typeof window.FaceDetector === 'undefined') {
            // Fallback: no real-time face box, but don't break anything
            return;
        }

        try {
            detectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        } catch {
            return; // Browser doesn't support it
        }

        const detect = async () => {
            const video = videoRef.current;
            if (!video || video.readyState < 2 || !detectorRef.current) {
                detectLoopRef.current = requestAnimationFrame(detect);
                return;
            }

            try {
                const faces = await detectorRef.current.detect(video);
                drawFaceOverlay(faces);
            } catch {
                // Detection can fail on some frames — ignore and retry
            }

            detectLoopRef.current = requestAnimationFrame(detect);
        };

        detectLoopRef.current = requestAnimationFrame(detect);
    }, [drawFaceOverlay]);

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
                    startFaceDetectionLoop();
                }
            } catch (err) {
                console.error('Camera error:', err);
                setError('Camera access failed. Please allow camera permission and reload this page.');
                setStatus('Camera unavailable. Enrollment cannot continue until camera permission is granted.');
            }
        };

        startCamera();

        // Cleanup
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (detectLoopRef.current) {
                cancelAnimationFrame(detectLoopRef.current);
            }
        };
    }, [startFaceDetectionLoop]);

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
        setLastAttemptFailed(false);
        setStatus(`Capturing frames... (0/${REQUIRED_FRAMES})`);

        let frameCount = 0;
        const frames = [];

        const captureInterval = setInterval(() => {
            const frame = captureFrame();

            if (frame) {
                frames.push(frame);
                frameCount++;
                setStatus(`Capturing frames... (${frameCount}/${REQUIRED_FRAMES})`);
                setCapturedFrames([...frames]);

                if (frameCount >= REQUIRED_FRAMES) {
                    clearInterval(captureInterval);
                    setIsCapturing(false);
                    setStatus('Capture complete! Click "Enroll Face" to save.');
                }
            }
        }, CAPTURE_INTERVAL);
    };

    // Enrollment progress percentage (0-100)
    const [enrollProgress, setEnrollProgress] = useState(0);
    const getFriendlyEnrollmentError = (err) => {
        if (err.code === 'ECONNABORTED') {
            return {
                message: 'Enrollment timed out while waiting for the server. Please retake and try again.',
                status: 'Server timeout. Check network stability and retry enrollment.',
            };
        }

        if (!err.response) {
            return {
                message: 'No internet connection or server is unreachable. Please check your network and try again.',
                status: 'Offline or backend unreachable.',
            };
        }

        const detail = err.response?.data?.detail;
        const errorPayload = detail?.error || detail;
        const errorCode = errorPayload?.code;
        const errorMessage = errorPayload?.message;
        const errorDetails = errorPayload?.details || {};

        if (errorCode === 'QUALITY_TOO_LOW') {
            const qualityPct = typeof errorDetails.quality_score === 'number'
                ? (errorDetails.quality_score * 100).toFixed(2)
                : null;
            return {
                message: qualityPct !== null
                    ? `Face not registered: quality is ${qualityPct}%, it must be above 75.00%.`
                    : 'Face not registered: captured quality must be above 75.00%.',
                status: 'Improve lighting, keep your whole face centered, and avoid blur before retaking.',
            };
        }

        if (errorCode === 'INSUFFICIENT_QUALITY_FRAMES') {
            return {
                message: 'Face not registered: not enough high-quality frames were captured.',
                status: 'Hold still, keep your face visible, and retake in brighter lighting.',
            };
        }

        if (errorCode === 'NO_FACE_DETECTED') {
            return {
                message: 'Face not registered: no clear face detected in the captured frames.',
                status: 'Face the camera directly, remove obstructions, and retake.',
            };
        }

        if (errorCode === 'DUPLICATE_FACE') {
            return {
                message: 'Possible facial duplication detected. This face appears to be already registered.',
                status: 'Contact your administrator if you believe this is a mistake.',
            };
        }

        if (err.response?.status >= 500) {
            return {
                message: 'Server error while processing enrollment.',
                status: 'The backend is down or unstable. Please try again in a few minutes.',
            };
        }

        return {
            message: errorMessage || 'Enrollment failed. Please retake and try again.',
            status: 'Enrollment did not complete. Please retake your capture.',
        };
    };

    // Submit enrollment with progress percentage
    const enrollFace = async () => {
        if (capturedFrames.length < 5) {
            setError('Not enough frames captured. Please try again.');
            return;
        }

        // Check if user is logged in
        const userId = user?.id || user?.user_id;
        if (!userId) {
            setError('User not found. Please log in again.');
            navigate('/');
            return;
        }

        setIsEnrolling(true);
        setError('');
        setLastAttemptFailed(false);
        setEnrollProgress(0);

        // Simulated progress phases while backend processes
        const phases = [
            { msg: 'Uploading frames...', pct: 10, duration: 1000 },
            { msg: 'Loading AI model...', pct: 25, duration: 2000 },
            { msg: 'Detecting faces...', pct: 50, duration: 3000 },
            { msg: 'Extracting facial features...', pct: 75, duration: 5000 },
            { msg: 'Saving to database...', pct: 90, duration: 2000 },
        ];

        let phaseTimeout;
        let currentPhase = 0;

        const updatePhase = () => {
            if (currentPhase < phases.length) {
                setStatus(phases[currentPhase].msg);
                setEnrollProgress(phases[currentPhase].pct);
                phaseTimeout = setTimeout(() => {
                    currentPhase++;
                    updatePhase();
                }, phases[currentPhase].duration);
            }
        };

        // Start phase animation
        updatePhase();

        try {
            // Face enrollment is slow (10-40s on CPU) — use 120s timeout
            const response = await api.post('/api/face/enroll', {
                user_id: userId,
                frames: capturedFrames
            }, { timeout: 120000 });

            // Clear phase animation
            clearTimeout(phaseTimeout);

            if (response.data.success) {
                const qualityPct = (response.data.quality_score * 100).toFixed(2);

                setEnrollProgress(100);
                setStatus(`Face enrolled successfully. Enrollment quality: ${qualityPct}%`);

                // Update user in localStorage AND AuthContext
                const updatedUser = { ...(user || {}), face_registered: true };
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                updateUser({ face_registered: true });

                // Redirect to dashboard based on role
                setTimeout(() => {
                    const userRole = user?.role?.toLowerCase();
                    if (userRole === 'student') {
                        navigate('/student-dashboard');
                    } else if (userRole === 'head' || userRole === 'dept_head') {
                        navigate('/dept-head-dashboard');
                    } else if (userRole === 'faculty') {
                        navigate('/faculty-dashboard');
                    } else if (userRole === 'admin') {
                        navigate('/admin-dashboard');
                    } else {
                        navigate('/');
                    }
                }, 2000);
            } else {
                setEnrollProgress(0);
                setLastAttemptFailed(true);
                setError(response.data.message || 'Enrollment failed. Please retake and try again.');
                setStatus('Enrollment did not complete. Retake is required.');
            }
        } catch (err) {
            clearTimeout(phaseTimeout);
            setEnrollProgress(0);
            setLastAttemptFailed(true);
            const feedback = getFriendlyEnrollmentError(err);
            setError(feedback.message);
            setStatus(feedback.status);
        } finally {
            setIsEnrolling(false);
        }
    };

    // Reset capture
    const resetCapture = () => {
        setCapturedFrames([]);
        setError('');
        setLastAttemptFailed(false);
        setStatus('Camera ready. Click "Start Capture" to begin.');
    };

    return (
        <div className="face-enrollment-page">
            <div className="enrollment-container">
                <div className="enrollment-branding">
                    <Logo size={40} colorShift={true} />
                    <span>FRAMES</span>
                </div>
                <div className="enrollment-header">
                    <h1>Face Enrollment</h1>
                    <p>Register your face to enable secure biometric access</p>
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
                        <canvas
                            ref={overlayCanvasRef}
                            className="face-overlay-canvas"
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                        {/* Face detection indicator */}
                        {cameraReady && !isCapturing && !isEnrolling && (
                            <div className={`face-detect-badge ${faceDetected ? 'detected' : 'not-detected'}`}>
                                <i className={`fas ${faceDetected ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                                {faceDetected ? 'Face Detected' : 'No Face Detected'}
                            </div>
                        )}

                        {isCapturing && (
                            <div className="capture-overlay">
                                <div className="capture-indicator">
                                    <i className="fas fa-camera" style={{ marginRight: '6px' }}></i> Capturing...
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

                    {/* Progress percentage during enrollment */}
                    {isEnrolling && (
                        <p className="status-text" style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                            {enrollProgress}% — {status}
                        </p>
                    )}
                    {!isEnrolling && <p className="status-text">{status}</p>}

                    {error && <p className="error-text"><i className="fas fa-exclamation-circle" style={{ marginRight: '6px' }}></i>{error}</p>}
                </div>

                <div className="controls-section">
                    {capturedFrames.length === 0 && !isCapturing && (
                        <button
                            className="btn-primary"
                            onClick={startCapture}
                            disabled={!cameraReady}
                        >
                            <i className="fas fa-camera" style={{ marginRight: '8px' }}></i> Start Capture
                        </button>
                    )}

                    {isCapturing && (
                        <button className="btn-secondary" disabled>
                            Capturing... ({capturedFrames.length}/{REQUIRED_FRAMES})
                        </button>
                    )}

                    {capturedFrames.length >= REQUIRED_FRAMES && !isEnrolling && !lastAttemptFailed && (
                        <>
                            <button className="btn-primary" onClick={enrollFace}>
                                <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i> Enroll Face
                            </button>
                            <button className="btn-secondary" onClick={resetCapture}>
                                <i className="fas fa-redo" style={{ marginRight: '8px' }}></i> Retake
                            </button>
                        </>
                    )}

                    {capturedFrames.length >= REQUIRED_FRAMES && !isEnrolling && lastAttemptFailed && (
                        <button className="btn-secondary" onClick={resetCapture}>
                            <i className="fas fa-redo" style={{ marginRight: '8px' }}></i> Retake
                        </button>
                    )}

                    {isEnrolling && (
                        <button className="btn-primary" disabled>
                            <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Processing... {enrollProgress}%
                        </button>
                    )}
                </div>

                <div className="tips-section">
                    <h3><i className="fas fa-lightbulb"></i> Tips for best results:</h3>
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
