1. What the latest logs show
From kiosk_server.py:
First recognition (warm‑up):
recognition_avg_ms ≈ 11,562 ms → ~11.5 seconds.
After warm‑up (steady state):
recognition_avg_ms ≈ 780–950 ms
avg_ms ≈ 780–950 ms, fps ≈ 0.1 for those windows.
So every time InsightFace runs, it blocks for ~0.8–1.0 seconds. That is why, even after our config optimizations, you still see visible “freezes” whenever recognition happens. The active‑class API is now fast; the lag is purely the heavy model.
This exactly matches what RECOGNITION_PIPELINE_RUNTIME_NOTES.md describes under Phase 3: as long as recognition and video live in the same loop/thread, heavy inference will freeze the video.
2. Evaluating the other AI’s suggestion
Their suggestion is:
> Proper Fix:
> Separate camera/display from recognition.
> Thread A (Camera): read frames, encode MJPEG, update /video_feed, never run InsightFace.
> Thread B (Recognition): periodically take latest frame, run MediaPipe + InsightFace, update attendance.
> Shared latest_frame protected by a lock.
This is exactly the professional solution described as Phase 3 in your runtime notes:
Producer–consumer model:
Producer (camera/display) runs at camera speed.
Consumer (recognition) runs as fast as the model allows, without blocking the producer.
Even if recognition takes 900 ms:
Video still updates at 15–30 FPS (limited only by camera & JPEG, not by InsightFace).
Recognition becomes a background worker that updates state, not the video loop itself.
So:
Yes, the suggestion is good.
It aligns perfectly with the “Separate camera/display from recognition” section in RECOGNITION_PIPELINE_RUNTIME_NOTES.md.
It’s the only way, on CPU‑only hardware, to have:
Heavy buffalo_l recognition, and
A truly smooth camera stream.
You already saw that with just timing tweaks we can’t escape the ~800 ms cost; we must separate loops.
3. Trade‑offs of this architecture (super detailed, tied to your MD)
These are the real‑world trade‑offs, expanding on the runtime notes:
3.1 Smooth video vs. live overlays
Pro:
Camera thread can always push frames to /video_feed, regardless of recognition:
No blocking on HTTP.
No blocking on InsightFace.
Browser gets a consistent frame stream → visually smooth.
Con:
Overlays (bounding boxes, names) now depend on shared state from recognition:
Camera thread wants to draw bbox/name from shared “last recognition result”.
That state updates at recognition frequency (e.g. 1–2 Hz), not camera FPS.
Result:
Video is smooth, but overlays “snap” or update less frequently (still much better UX than freezes).
In practice, for classroom kiosks, this is acceptable: the video moving smoothly is more important than per‑frame overlay animation.
3.2 Freshness of recognition vs. CPU load
Two knobs still matter even with separate threads:
Recognition frequency (RECOGNITION_MIN_INTERVAL_SECONDS):
Lower interval:
Pros: more frequent recognitions; faster reaction when someone walks in.
Cons: higher CPU, more background load; state (attendance, UI) updates more often.
Higher interval:
Pros: lower CPU utilization; background worker is calmer.
Cons: attendance state & name in the UI update more slowly.
Schedule of recognition (e.g. “every X seconds”):
You might run:
Every 0.5–1.0s while faces are present.
Less often when no faces are detected (e.g. gating on “no face in the last N frames” on the camera thread, or dummy face presence check before queuing a job).
The MD file already explains these; in the two‑thread design they simply apply to Thread B only, not the camera.
3.3 Simplicity vs. robustness
Single-thread loop (what you had before):
Pros: simpler mental model; one place handles everything.
Cons: Any heavy step (InsightFace, HTTP) blocks everything.
Two-thread architecture:
Pros:
Much more robust to:
Slow models,
Slow backend,
Momentary CPU spikes.
Camera behaves like a dedicated “service” that just keeps streaming.
Cons:
Code complexity:
Shared state (latest_frame, overlay_state, current_state) must be protected by locks.
Need careful shutdown and error handling so threads exit cleanly.
Debugging and reasoning are trickier (race conditions possible if not careful).
Your runtime notes already warn about race conditions under “no slop code”; this architecture is worth the complexity, but it requires discipline.
3.4 CPU usage patterns
In the current (single-thread) design:
CPU usage is “bursty”: long 800 ms spikes where CPU is pegged in InsightFace, then idle.
The UI feels laggy because those spikes also control the video.
In the two-thread design:
CPU usage is similar overall, but:
Camera thread uses a small, steady fraction of CPU (capture + JPEG).
Recognition thread periodically spikes on InsightFace.
The key difference is what the user feels:
Video moves continuously → perceived smoothness,
Recognition state updates as a background process.
4. How this maps to the MD doc
Your RECOGNITION_PIPELINE_RUNTIME_NOTES.md Phase 3 section already describes:
Separate camera/display from recognition.
Use a producer–consumer pattern.
Maintain a “latest frame” buffer that recognition reads.
Update metrics and recognition state separately.
The AI suggestion you pasted is:
A concrete instance of that design.
It matches the “real professional solution” we documented:
Camera never runs InsightFace.
Recognition never controls the camera loop.
So your notes are consistent with the suggestion; the suggestion is basically a shorter version of Phase 3.
5. What I recommend you do next
Given everything above:
The suggestion is correct and aligns perfectly with your runtime notes.
The remaining work is pure implementation effort:
Refactor StreamingAttendanceKiosk into:
Camera / MJPEG thread,
Recognition / attendance thread,
Shared latest_frame and overlay_state with locks.
Once that’s done, your heavy buffalo_l recognitions will no longer freeze the video, even at ~800 ms each.
If you want, the next step is for me to:
Introduce a dedicated camera thread in kiosk_server.py that:
Reads frames,
Draws simple overlays from shared state,
Calls _update_mjepg(...) only from that thread.
Turn the existing run loop into a pure recognition loop that:
Reads copies of latest_frame,
Runs MediaPipe + InsightFace + attendance,
Writes recognition results / overlay hints into shared state (but never touches MJPEG).
That would fully realize the Phase 3 architecture from your MD and the other AI’s suggestion.