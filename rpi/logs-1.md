Why it’s still laggy (what the logs say)
From your latest run:
First recognition:
recognition_avg_ms=11562.1 → ~11.5 seconds (warm‑up).
After warm‑up, still:
recognition_avg_ms≈780–950ms
avg_ms≈780–950ms
fps≈0.1 for those windows
That means: every time InsightFace runs, it blocks the loop for ~0.8–1.0 seconds. Even though we now:
Use det_size=(320, 320) (smaller input),
Use MediaPipe gating + cropping,
Throttle via RECOGNITION_MIN_INTERVAL_SECONDS and frame skip,
InsightFace buffalo_l on CPU only is still extremely heavy. So whenever a recognition happens, the main loop (which also drives video_feed) stalls for ~1s, and you see that as a freeze / big stutter.
The active‑class API is no longer the bottleneck here; it’s purely model inference time.
The fundamental constraint
There’s an unavoidable trade‑off:
Buffalo_l is a big, accurate model designed with GPU in mind.
On a CPU‑only laptop, even with optimizations, it’s normal to see:
500–1000 ms per inference, especially at first use.
You are trying to do two conflicting things on the same CPU thread:
Maintain a smooth video (ideally 15–30 FPS → 33–66 ms per frame).
Run a model that takes ~800+ ms per recognition.
Mathematically, a single thread cannot run a 800 ms task and still deliver 30 different frames per second. The best we can do is:
Make sure the video is not controlled by the heavy task (separate threads / processes).
Or run a much lighter model (different embedding model → but then enrollment embeddings must be regenerated).
Right now, the streaming kiosk still has one main loop that does both display and recognition. We’ve reduced how often recognition runs (interval + frame skip), but when it does run, it still monopolizes the loop.
Trade‑offs in each optimization (from RECOGNITION_PIPELINE_RUNTIME_NOTES.md)
I’ll walk through the levers we now have and their pros/cons in detail.
1. Active‑class API (USE_ACTIVE_CLASS_API, ACTIVE_CLASS_FAILURE_BACKOFF_SEC)
What it does:
When USE_ACTIVE_CLASS_API = True:
Kiosk calls /api/kiosk/active-class?device_id=... to know which class is active.
On repeated failures, ScheduleResolver:
Sets _last_api_failure,
For the next ACTIVE_CLASS_FAILURE_BACKOFF_SEC seconds, skips HTTP and uses cached schedule.
When USE_ACTIVE_CLASS_API = False:
It never calls the backend; class resolution uses the cached weekly schedule only.
Trade‑offs:
Pros:
Avoids huge stalls when the backend or network is down.
Guarantees that a dead API doesn’t completely kill the video.
Cons:
If you rely on real‑time schedule changes (e.g., exceptions, room moves), and you:
Turn the API off entirely (USE_ACTIVE_CLASS_API=False), or
Set a very long backoff,
Then the kiosk might show slightly stale schedule state during outages.
Key point for you now:
With your backend running and fast, this is NOT causing current lag; it just protects you from failures.
2. Detector input size: RECOGNITION_DET_SIZE
What it does:
Controls the input resolution for InsightFace’s internal detector (det-size).
We changed laptop from (640, 640) → (320, 320).
Trade‑offs:
Larger (640, 640)
Pros:
Better detection at longer distances / smaller faces.
Potentially higher accuracy on low‑quality images.
Cons:
More pixels → more FLOPs → slower.
On CPU: can easily double or triple inference time.
Smaller (320, 320) (what you have now)
Pros:
Roughly cuts detection cost by ~4x in theory (less in practice, but still big).
Directly reduces recognition_avg_ms.
Cons:
Very small / far faces may be missed or have lower quality.
Slight accuracy hit if people are standing very far away.
Given that you’re using a kiosk at classroom distance (not CCTV), (320, 320) is usually acceptable and is a good trade for speed.
3. Gated detection + cropping (USE_GATED_DETECTION, FaceDetector.crop_face, get_embedding_from_crop)
What it does:
Pipeline when USE_GATED_DETECTION = True:
MediaPipe (BlazeFace) detects faces quickly.
We take the largest face bounding box, add a margin, and crop to 112×112.
We pass that small crop to FaceRecognizer.get_embedding_from_crop(...).
Trade‑offs:
Pros:
Avoids running InsightFace’s detector on the full frame.
Smaller crop + simpler detection → significantly cuts computation.
Especially beneficial on Pi / low‑power CPUs.
Cons:
Two detectors in the pipeline:
MediaPipe + InsightFace’s internal detection (still used on the crop).
Cropping can slightly reduce context; if MediaPipe’s bounding box is off, embedding quality may drop a bit.
Still doesn’t remove the heavy cost of the embedding network itself, which is the big CNN at the core of buffalo_l.
You’re already using this, which is why your recognition_avg_ms dropped from ~1.2s+ toward the 0.8–0.9s range, but not enough to “feel” smooth.
4. Frame skipping: RECOGNITION_FRAME_SKIP
What it does:
Only runs recognition on every Nth frame:
RECOGNITION_FRAME_SKIP = 2 → process every 2nd frame.
Video still shows all frames; only recognition is skipped.
Trade‑offs:
Higher skip (e.g., 3, 4, 5):
Pros:
Fewer heavy recognition runs.
Less CPU load, more time for camera / UI.
Cons:
Recognition reacts more slowly when a new face walks in.
If someone pops into view briefly, you might miss them if they’re between processed frames.
Lower skip (1):
Pros:
Fastest reaction; every frame is candidate for recognition.
Cons:
Maximum CPU load, worst FPS if recognition is slow.
Right now on laptop: RECOGNITION_FRAME_SKIP = 2 is a middle ground:
But because each recognition is still ~800ms, skipping only halves the number of those 800ms stalls; you still see big stutters whenever they occur.
5. Throttling interval: RECOGNITION_MIN_INTERVAL_SECONDS
What it does:
Imposes a minimum time between recognition runs, even if:
There’s a face in every frame, and
RECOGNITION_FRAME_SKIP says “okay to try”.
For example, laptop default:
RECOGNITION_MIN_INTERVAL_SECONDS = 0.7:
Means: run InsightFace at most once every 0.7 seconds.
Trade‑offs:
Higher interval (e.g., 1.0–1.5 seconds):
Pros:
Fewer heavy 800ms stalls per unit time.
More “free” frames where the video can update smoothly.
Cons:
Recognition appears slower to react to changes (faces entering/leaving, gesture prompts).
If someone walks by quickly, you might get fewer “shots” at them.
Lower interval (0.3–0.5 seconds):
Pros:
More frequent recognition; better tracking of moving faces.
Cons:
More frequent 800ms stalls; video feels jerkier.
Given your logs:
Even when we limit frequency, each stall is still ~0.8–1.0s.
So you feel “frozen” during those recognitions, even if they happen less often.
6. Camera resolution & FPS (CAMERA_WIDTH, CAMERA_HEIGHT, CAMERA_FPS)
What they do:
Control how big each frame is and how often we attempt to show a new frame.
Trade‑offs:
Higher resolution / FPS:
Pros:
Sharper video, more detail for faces.
Cons:
More data per frame → more work in every step that touches the full frame (camera IO, UI, gating).
On weak CPUs, may exacerbate bottlenecks.
Lower resolution / FPS:
Pros:
Fewer pixels → more CPU headroom for recognition.
Reduces bandwidth for /video_feed streaming.
Cons:
Slightly blurrier image.
If FPS is too low, video feels choppy regardless of recognition speed.
On laptop we left these at 640×480 @ 30fps because your bottleneck is not camera I/O; it’s pure model compute. On RPi, config already reduces resolution.
Why the video still stutters visually
Even with:
Gated detection + crops,
Smaller det_size,
Frame skipping,
Interval throttling,
The core reality from your metrics is:
recognition_avg_ms ≈ 800–950ms – each recognition blocks the loop for almost a full second.
And in the current StreamingAttendanceKiosk.run:
Recognition and MJPEG update still happen in the same Python thread.
So when we hit a heavy recognition step:
The while self.running loop is busy inside face_recognizer.get_embedding....
It doesn’t call _update_mjepg(...) until that returns.
The browser sees the same last frame for that entire ~800ms window.
The interval + skip means this doesn’t happen every frame, but whenever it does, you’ll still see a noticeable “pause” in the video.
To truly hide that, we need what I described earlier:
> A producer–consumer design: one thread/loop just for camera+MJPEG, another thread/loop for recognition.
That way:
Camera thread:
Keeps reading frames and encoding JPEGs.
Never waits for InsightFace.
Video FPS is limited by camera + JPEG encoding, not recognition.
Recognition thread:
Every N ms, it grabs the latest frame from shared memory.
Runs the slow InsightFace work.
Updates attendance and WebSocket state.
Even if recognition takes 800ms, the video can stay at 15–30 FPS, because camera → MJPEG is no longer blocked.
Right now, we have only added timing and frequency throttles, not a full threading separation.
What you can do next
Given your logs and constraints:
If you want smoother video right now without deeper refactor:
In config.py (laptop section), try:
RECOGNITION_MIN_INTERVAL_SECONDS = 1.2 or 1.5
RECOGNITION_FRAME_SKIP = 3
This will:
Space out heavy recognitions more (fewer stalls per minute).
Make the video “mostly smooth” with occasional ~0.8s freezes.
If you want truly smooth video + recognition:
The correct solution is to refactor StreamingAttendanceKiosk into:
A camera/display thread that always updates /video_feed.
A recognition thread that operates on a shared “latest frame” buffer.
This is more invasive code surgery (multiple functions, careful thread safety), but it’s the only way to fully decouple video smoothness from recognition time on a CPU‑only system.
Long‑term, if hardware allows:
Running InsightFace with a GPU (even a modest one) drops recognition from ~800ms → tens of ms.
Then even a single‑thread loop can feel smooth.
How this connects to RECOGNITION_PIPELINE_RUNTIME_NOTES.md
That document describes:
Phase 1: Observability + metrics + API backoff (we’ve done).
Phase 2: Gated detection, cropping, and avoiding redundant color conversions (we’ve done).
Phase 3: Producer–consumer camera vs recognition (we discussed but have not fully implemented yet).
You are now feeling the limits of Phase 2: we’ve squeezed a lot of performance out of the model with configuration, but:
As long as a heavy model runs in the same loop as video, any 800ms recognition will “freeze” the camera for that moment.