# Chapter 2

## REVIEW OF RELATED LITERATURE AND STUDIES

This chapter presents a comprehensive collection of relevant foreign and local literature and studies that support the development of **Facial Recognition and Attendance Monitoring with Embedded System (FRAMES)**: A Web-Based, Gesture-Gated Facial Recognition Attendance System Using Raspberry Pi. It covers the key technological domains of the study, reviews related foreign and local studies, presents the conceptual framework, and defines operational terms used throughout the study.

---

## Review of Related Literature

### Smart Monitoring in Educational Systems

Smart monitoring in education emphasizes the automation of attendance tracking and classroom management by leveraging technologies such as the Internet of Things (IoT), embedded systems, and real-time analytics. Rama Krishna et al. (2023) synthesized existing smart attendance systems using Raspberry Pi and highlighted common design strategies including camera-based recognition, web dashboards, and IoT integration. Their review identified key gaps such as the lack of multimodal authentication and limited evaluation of real-time performance. Similarly, Zhao, Zhao, and Qu (2022) introduced an IoT-based classroom attendance management framework that enabled centralized monitoring of student presence, integration of faculty schedules, and analysis of subject-based usage trends. Their study emphasized that smart monitoring extends beyond raw attendance logging, instead generating higher-level insights for resource allocation and administrative decision-making.

Swathi and RathnaChary (2023) advanced this concept by demonstrating a Raspberry Pi–driven attendance system that employed video-based face detection and recognition in classroom settings. The authors emphasized the efficiency of live monitoring pipelines and the ability of Raspberry Pi to support educational deployment at relatively low cost. Ashok Kumar et al. (2021) explored deep learning–enabled attendance monitoring, combining Raspberry Pi with recognition models to achieve improved accuracy while maintaining feasibility for smart classroom use cases. These studies collectively demonstrate that "smart" monitoring is operationalized through features such as real-time dashboards, analytics, and automated logging rather than behavioral surveillance.

From these insights, the present study defines smart monitoring in a scoped and practical sense: enabling entry, exit, and break tracking through facial recognition and gesture control, and producing class-specific attendance reports, visual dashboards, and anomaly notifications for unrecognized individuals. Unlike prior work that focused solely on facial recognition or IoT integration, FRAMES integrates multimodal fusion (face + gesture) with real-time web-based visualization, ensuring the monitoring process is both accurate and actionable for students, faculty, and department heads.

---

### Embedded Systems for Attendance Monitoring

Embedded systems serve as the backbone for low-cost, portable, and real-time attendance monitoring applications. By integrating hardware like the Raspberry Pi with software pipelines for detection and recognition, they enable on-device processing and reduce dependency on external servers. Swathi and RathnaChary (2023) demonstrated such integration by using Raspberry Pi as the embedded platform for face detection and attendance management, highlighting its efficiency in managing live classroom data with minimal external infrastructure. Their findings underscore the device's suitability for educational contexts where affordability and portability are key constraints.

Ashok Kumar et al. (2021) extended this perspective by employing deep learning models on Raspberry Pi to enhance recognition accuracy, balancing computational feasibility with accuracy by optimizing lightweight neural models for embedded deployment. More recently, Touzene, Abed, and Larabi (2024) introduced an Embedded Intelligent System for Attendance Monitoring, coupling Raspberry Pi hardware with web-based dashboards. Their system emphasized modular design, capturing and processing attendance data directly on the Pi while synchronizing outputs to a central interface for administrators.

Collectively, these studies show that embedded systems can sustain attendance monitoring by combining low-power hardware, optimized recognition pipelines, and integrated web dashboards. For FRAMES, the **Raspberry Pi 4 Model B** is selected as the embedded device to balance cost and performance. Unlike the Raspberry Pi Camera Module, which requires the proprietary CSI interface and the complex `picamera2`/libcamera software stack, FRAMES employs a **standard USB webcam** connected to the Pi via the Universal Video Class (UVC) protocol. This design choice simplifies hardware setup, reduces points of failure, and enables plug-and-play camera replacement—a practical advantage for classroom deployment. The USB webcam provides 720p resolution at 30fps, which is sufficient for reliable face detection and embedding extraction by InsightFace's `buffalo_sc` model.

---

### Facial Recognition Techniques for Edge Devices

#### Overview of Approaches

Facial recognition on edge devices generally falls into two major categories: traditional feature-based methods (e.g., HOG + SVM, Haar cascades) and modern deep learning embedding pipelines (e.g., MobileNetV2 + ArcFace). The embedding-based approach offers improved accuracy and resilience to variations in lighting, angle, and expression, though it demands careful optimization for deployment on constrained hardware. Nguyen et al. (2021) demonstrated through AIP Conference research that classic detection methods using Haar or HOG can achieve real-time performance on Raspberry Pi 2, 3, and especially Pi 4 when input image widths are kept at or below 300 pixels. However, deeper detectors like SSD or MMOD exhibit significantly slower speeds and are unsuitable for real-time tasks without hardware acceleration.

#### InsightFace and the buffalo_sc Model Pack

InsightFace is an open-source face analysis library developed primarily by researchers at the Institute of Automation, Chinese Academy of Sciences (CASIA), with key contributors including Jia Guo and Jiankang Deng (Guo et al., 2021; Deng et al., 2019). The library provides pre-trained model packs—collectively called "buffalo" models—that bundle face detection and recognition capabilities:

| Model Pack | Backbone Network | Target Platform | LFW Accuracy | Model Size |
|------------|-----------------|-----------------|-------------|------------|
| **buffalo_l** | ResNet-100 | Server / GPU | 99.77% | ~325 MB |
| **buffalo_m** | ResNet-50 | Desktop CPU | ~99.5% | ~180 MB |
| **buffalo_s** | MobileFaceNet (smaller) | Edge devices | ~97.8% | ~20 MB |
| **buffalo_sc** | MobileFaceNet (compact) | **Edge / RPi** | **~97.5%** | **~7 MB** |

FRAMES uses the **`buffalo_sc`** model pack for both enrollment and recognition. This model pack bundles two essential sub-models:

1. **SCRFD (Sample and Computation Redistribution for Efficient Face Detection)** (~2.5 MB) — a lightweight face detection model that locates faces in the camera frame and extracts five facial landmarks (left eye, right eye, nose tip, left mouth corner, right mouth corner). These landmarks are used for face alignment prior to embedding extraction.

2. **MobileFaceNet** (~4.5 MB) — the recognition model, a neural network based on the MobileNetV2 architecture specifically optimized for face recognition on mobile and embedded devices. It converts aligned 112×112 face crops into 512-dimensional normalized embedding vectors.

#### Why buffalo_sc Over buffalo_l?

The choice of `buffalo_sc` over the larger `buffalo_l` model is driven by the hardware constraints of the Raspberry Pi 4:

| Metric | buffalo_l (ResNet-100) | buffalo_sc (MobileFaceNet) |
|--------|----------------------|--------------------------|
| Recognition inference (RPi 4) | ~3,000–3,500 ms | ~300–500 ms |
| Cold model load time | ~6,000–7,500 ms | ~2,000 ms |
| Model file size (recognition) | ~166 MB | ~4.5 MB |
| Total model pack size | ~325 MB (5 sub-models) | ~7 MB (2 sub-models) |
| Memory usage | ~600 MB | ~200 MB |
| LFW accuracy | 99.77% | ~97.5% |
| Effective kiosk FPS | 0.2–0.3 FPS | 2–3 FPS |
| User-perceived latency | "System frozen" | "Nearly instant" |

The 99.77% → 97.5% accuracy difference comes from the Labeled Faces in the Wild (LFW) benchmark, which tests with low-resolution web photos, extreme lighting, heavy occlusion, and extreme head poses. Under controlled kiosk conditions—where users stand 50–100 cm from the camera in indoor lighting, facing the camera directly—both models achieve near-100% recognition accuracy. The 2.27% gap manifests only in extreme edge cases that do not apply to the FRAMES kiosk scenario.

#### How MobileFaceNet Achieves Efficiency

MobileFaceNet was published by Chen et al. (2018) in "MobileFaceNets: Efficient CNNs for Accurate Real-Time Face Verification on Mobile Devices." Its key innovation is the use of **depthwise separable convolutions** from the MobileNetV2 architecture, which decompose standard convolutions into two steps:

1. **Depthwise convolution** — applies a single spatial filter per input channel
2. **Pointwise convolution** — combines channel outputs using 1×1 convolutions

For a typical 3×3 filter on 256 channels, this reduces computation:
- Standard convolution: 3 × 3 × 256 × 256 = **589,824 multiplications**
- Depthwise separable: (3 × 3 × 256) + (256 × 256) = **67,840 multiplications** (~8.7× fewer)

The network architecture processes aligned 112×112 face images through a series of depthwise separable blocks, progressively reducing spatial dimensions while increasing channel depth, culminating in a Global Depthwise Convolution followed by a fully connected layer that outputs the 512-dimensional embedding, which is then L2-normalized to a unit vector.

#### Training Methodology

InsightFace's buffalo models are trained using **ArcFace loss** (Deng et al., 2019), a metric learning approach that optimizes embedding distances by adding an angular margin penalty during training:

- The model is trained on the **MS1MV2** dataset (~5.8 million face images across ~85,000 identities)
- The ArcFace loss forces same-person embeddings to cluster tightly together and different-person embeddings to separate by at least an angular margin of *m* = 0.50 radians
- After training, the classification head is discarded, leaving only the feature extractor that converts faces into 512-dimensional vectors

This training strategy ensures that the model generalizes to faces never seen during training—a critical property for an attendance system where enrolled users were not part of the training dataset.

#### Face Embedding Computation

When a face image enters the recognition pipeline, the following steps produce the embedding:

1. **Face Detection (SCRFD):** The input frame is resized to the configured `det_size` (e.g., 320×320 for RPi, 640×640 for server). A Feature Pyramid Network (FPN) detects faces at multiple scales, outputting bounding boxes, confidence scores, and 5 facial landmarks.

2. **Face Alignment:** Using the 5 landmarks, a similarity transform (rotation + scale + translation) maps the detected face to a canonical 112×112 template with standardized eye, nose, and mouth positions.

3. **Embedding Extraction (MobileFaceNet):** The aligned 112×112×3 (RGB) face crop passes through the neural network:
   - Conv 3×3 (stride 2) → 56×56×64
   - 5 Depthwise Separable Blocks → 14×14×128
   - 6 Depthwise Separable Blocks → 7×7×256
   - Global Depthwise Conv 7×7 → 1×1×256
   - Fully Connected → 512
   - L2 Normalization → 512-dimensional unit vector

4. **Matching (Cosine Similarity):** The resulting embedding is compared against all enrolled embeddings using cosine similarity:
   
   cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)
   
   Since embeddings are L2-normalized, this simplifies to the dot product (A · B). A score ≥ 0.30 indicates a match.

#### Comparison with Other Facial Recognition Approaches

| Approach | Accuracy (LFW) | Inference on RPi 4 | Model Size | Anti-Spoofing | Used in FRAMES? |
|----------|----------------|--------------------|-----------|--------------:|:---:|
| Haar Cascade + LBPH | ~83% | ~50ms (detection only) | < 1 MB | None | ❌ |
| HOG + SVM | ~88% | ~80ms (detection only) | < 5 MB | None | ❌ |
| dlib ResNet (128-d) | ~99.38% | ~1,500ms | ~23 MB | None | ❌ |
| OpenCV DNN (SSD + FaceNet) | ~99.0% | ~800ms | ~30 MB | None | ❌ |
| InsightFace **buffalo_l** (ResNet-100) | 99.77% | ~3,000–3,500ms | ~166 MB | None (built-in) | ❌ (too slow) |
| InsightFace **buffalo_sc** (MobileFaceNet) | **~97.5%** | **~300–500ms** | **~4.5 MB** | **None (gesture-gated)** | **✅** |
| DeepFace (multi-backend) | ~97–99% | ~2,000–5,000ms | ~100–500 MB | None | ❌ |

FRAMES selected InsightFace `buffalo_sc` because it provides the optimal balance of speed, accuracy, and memory usage for the Raspberry Pi 4 platform. The slight accuracy trade-off compared to `buffalo_l` is negligible under controlled kiosk conditions and is more than compensated by the 7–10× speed improvement.

---

### Face Detection vs. Face Recognition

It is important to distinguish between two separate processes in the pipeline (Liu et al., 2023):

- **Face Detection** answers "Where is the face?" — it identifies and localizes face regions within a camera frame using bounding boxes and confidence scores. In FRAMES, the SCRFD detector and a MediaPipe BlazeFace pre-filter handle this step.

- **Face Recognition** answers "Whose face is it?" — it extracts a unique numerical representation (embedding) from the detected face region and compares it against stored profiles. In FRAMES, MobileFaceNet performs embedding extraction, and cosine similarity performs the matching.

---

### Face Embeddings and Anti-Spoofing

Face embeddings are high-dimensional numerical vectors generated by deep neural networks. Each 512-dimensional embedding represents abstract facial features that remain consistent across lighting, angle, or expression changes (Schroff et al., 2015; Deng et al., 2019). These embeddings enable fast similarity comparison—smaller angular distances indicate higher likelihood of identity match.

A persistent challenge in facial recognition is spoofing, where printed photos or video replays are used to impersonate legitimate users. FRAMES employs **gesture gating** as a behavioral liveness layer: even if a face image is presented, the system requires a corresponding physical hand gesture within a short time window. This ensures both liveness and intent, addressing common presentation-attack vectors without relying on complex 3D or infrared sensors (Mukthineni et al., 2020).

Although facial embeddings demonstrate strong resilience to variations in lighting and appearance, several factors can influence recognition accuracy. The embedding process primarily encodes geometric relationships among facial landmarks rather than raw color information, making it relatively robust across diverse skin tones. However, bias may still arise if pre-trained models were developed using imbalanced datasets, underscoring the importance of uniform lighting and camera calibration (Buolamwini & Gebru, 2018). Facial occlusions such as masks present a more significant challenge, as they obscure key regions used for feature extraction (Boutros et al., 2021). In FRAMES, this issue is mitigated through multimodal fusion—combining face recognition with gesture confirmation—ensuring that authentication remains secure even when facial visibility is partially limited.

---

### Hand Gesture Recognition for Control

Hand gesture recognition can be categorized into **static gestures** (fixed hand poses) and **dynamic gestures** (motion over time). For low-power embedded devices such as the Raspberry Pi, static gestures are more reliable and less computationally demanding, making them suitable for simple control actions such as logging attendance states (Mohamed, Hassan, & Jamil, 2024).

The most widely used pipeline for lightweight gesture recognition is **MediaPipe Hands**, developed by Google (Lugaresi et al., 2019). MediaPipe detects 21 hand landmarks per hand and passes them through a classifier for gesture identification. The system achieves stable frame rates on the Raspberry Pi while maintaining consistent tracking of hand landmarks (Random Nerd Tutorials, 2023).

While alternatives exist—such as OpenCV-based contour and skin-color detection for simple setups (HTIcodes, n.d.) and CNN-based approaches for higher accuracy (Raksha et al., 2025)—MediaPipe offers the best balance of efficiency and accuracy for edge devices. CNN-heavy solutions provide marginal accuracy gains at the cost of significantly lower FPS, often rendering them impractical for real-time applications on the Raspberry Pi.

Challenges remain in real-world deployment. Mohamed et al. (2024) noted that cluttered backgrounds, varying lighting, occlusion, and camera placement significantly impact recognition reliability. To mitigate these issues, FRAMES uses:

- **Static gestures only** (open palm, peace sign, thumbs-up, closed fist) for maximum reliability
- **Distance-ratio finger extension detection** for gesture classification based on landmark spatial relationships
- **Three-frame temporal smoothing (debounce logic)** requiring consistent detection across consecutive frames before accepting a gesture

The implemented gestures in FRAMES are:
- **Automatic Entry** — face recognition triggers entry without gesture
- **Peace Sign (two fingers)** — break-out (leaving temporarily)
- **Thumbs-Up** — break-in (returning from break)
- **Open Palm** — exit (logging out for the day)

---

### Multimodal Fusion (Face + Gesture) and Gesture-Gated Logging

Multimodal fusion—the combination of two or more biometric or behavioral channels—improves authentication reliability by exploiting the complementary strengths of each modality. Jha et al. (2024) explained that integrating facial features with a behavioral modality such as gestures increases the system's robustness against environmental noise and spoofing attacks; fusion reduces false acceptance while preserving usability.

One pragmatic fusion design is **sequential gating**: first confirm identity via face recognition, then prompt for a confirming gesture within a short temporal window. Mukthineni et al. (2020) showed that tying a hand gesture to an already-recognized face reduces accidental activations and raises the effective security level, since an attacker must spoof both modalities simultaneously.

Different fusion strategies exist. **Decision-level fusion** (where each sensor issues a local accept/reject and the system combines these signals) is straightforward and well suited for constrained hardware. Score-level and feature-level fusion are more computationally demanding. Bala, Gupta, and Kumar (2021) highlighted how decision-level fusion provides the best cost/benefit trade-off for embedded systems because it minimizes cross-modal preprocessing.

A second important element is the **temporal window and debounce policy**. Sarma and Bhuyan (2021) discussed gesture spotting and suggested that robust gesture segmentation and debouncing are critical for avoiding spurious activations caused by random hand movements or passing people.

FRAMES implements sequential gating (face → gesture) with the following design:
1. Face detection and embedding matching occur first
2. If recognition score ≥ threshold (0.30), the kiosk prompts for a gesture (for break/exit actions)
3. The gesture must be detected consistently across 3 consecutive frames (debounce)
4. Only then is the attendance action logged

This design prioritizes safety (minimizing false accepts), simplicity (decision-level checks are computationally lightweight), and usability (short, clear gesture actions). Entry logging is automatic upon facial recognition, as the act of intentionally standing before the kiosk camera already implies intent.

---

### Real-Time Vision on Raspberry Pi (Performance and Optimization)

The Raspberry Pi 4 Model B, powered by a quad-core ARM Cortex-A72 processor at 1.5 GHz with 4 GB of LPDDR4 RAM, is a popular platform for real-time vision applications due to its affordability and portability. However, its lack of a dedicated neural accelerator necessitates careful optimization (Aboluhom & Kandilli, 2025).

#### Model Optimization Strategies

Several optimization strategies are relevant for deploying face recognition on the Pi:

- **Model Selection:** Using lightweight architectures like MobileFaceNet (4.5 MB) instead of ResNet-100 (166 MB) provides the most significant performance improvement—~7–10× faster inference.
- **ONNX Runtime:** Rather than converting models to TensorFlow Lite, FRAMES uses ONNX Runtime as the inference engine, which provides optimized execution of InsightFace's native ONNX model format on ARM64 CPUs.
- **Detection Size Tuning:** Reducing `det_size` from (640,640) to (320,320) or (160,160) significantly accelerates face detection with minimal accuracy impact at kiosk viewing distances.
- **Multi-threaded Pipeline:** Separate threads handle camera capture, inference, and display, delivering smoother performance than single-threaded approaches (Tank, Patel, & Deshmukh, 2022).
- **MediaPipe Gated Detection:** A fast MediaPipe BlazeFace check (~30ms) gates the heavier InsightFace inference (~300–500ms), so InsightFace is only invoked when a face is actually present.

#### USB Webcam vs. CSI Camera Performance

The selection of a USB webcam over the Raspberry Pi Camera Module introduces a small capture latency difference:

| Metric | Pi Camera (CSI) | USB Webcam |
|--------|----------------|------------|
| Frame capture (720p) | ~8ms | ~15ms |
| Software stack | picamera2 + libcamera | OpenCV (V4L2/UVC) |
| Total capture latency | ~10–20ms | ~15–30ms |

This 5–15ms difference is negligible relative to the ~300–500ms InsightFace inference time. The USB webcam's advantages—plug-and-play operation, longer cable reach (1.4m vs. 15–30cm CSI), simpler software stack, wider availability, and lower cost—outweigh the marginal latency increase.

#### FRAMES Performance on Raspberry Pi 4

The FRAMES kiosk achieves the following measured performance:

| Stage | Time |
|-------|------|
| USB frame capture | 15–25ms |
| MediaPipe face gate | 25–35ms |
| InsightFace detection (SCRFD) | 100–160ms |
| Embedding extraction (MobileFaceNet) | 30–50ms |
| Embedding comparison (cosine similarity) | 5–15ms |
| Gesture detection (MediaPipe Hands) | 20–30ms |
| **Total per recognition (face found)** | **~250–350ms** |
| Total per frame (no face, gate skip) | ~45–70ms |

This yields an effective recognition rate of ~3–4 recognitions per second, which is responsive for a kiosk attendance scenario.

---

### Attendance System Modality Comparison

Different attendance and access-control modalities offer distinct operational characteristics:

| Modality | Hygiene | Speed | Spoof Resistance | Cost | Proxy Prevention |
|----------|---------|-------|-------------------|------|-----------------|
| Manual Roll Call | ✅ No contact | Slow (5–10 min) | Very low | Free | Very low |
| RFID Cards | ✅ Minimal contact | Fast (< 1s) | Low (card sharing) | Low | Low |
| QR Code Scanning | ✅ No contact | Fast (1–2s) | Low (screenshot sharing) | Low | Low |
| Fingerprint | ❌ Contact required | Medium (1–3s) | Medium | Medium | Medium |
| Face Recognition Only | ✅ No contact | Medium (1–3s) | Low (photo spoofing) | Medium–High | Medium |
| **Face + Gesture (FRAMES)** | **✅ No contact** | **Medium (~1–2s)** | **Medium–High** | **Low** | **High** |

FRAMES's face + gesture approach provides a balanced solution: it preserves touchless operation, mitigates proxy attendance through intentional gesture confirmation, and can be implemented with a single USB webcam per room (Vadwala, 2024; Mukthineni et al., 2020).

---

### Web Dashboards and Digital Room Visualization

Modern attendance dashboards balance quick-glance awareness with drill-down capability. Common visualization patterns include per-room tiles summarizing occupancy, timeline views displaying individual activity, and exportable reports for administrative use (Domo, 2025; Olowe et al., 2024). These patterns are widely used because they provide complementary perspectives: tiles enable immediate awareness of classroom status, while timelines and reports support deeper analysis.

The FRAMES backend is built with **FastAPI** (Python), an asynchronous web framework that provides high throughput and low latency for concurrent requests. Unlike Flask (synchronous), FastAPI supports WebSocket-based live updates natively, enabling real-time streaming of attendance events to the dashboard (FastAPI documentation, n.d.; Boadzie, 2025). The frontend uses **Vite + React (JSX)** with **Bootstrap 5.3** for responsive layout and **Chart.js / Recharts** for attendance visualization. The dashboard is mobile-responsive and accessible from desktop and mobile browsers without a dedicated mobile application.

In FRAMES, the dashboard is structured around a single-room layout for the pilot deployment. The room is represented by a tile listing its currently active occupants, with color-coded indicators: **green** for present (after entry or break-in) and **yellow** for break (after break-out). Status updates are streamed in near real-time via WebSocket connections, eliminating the need for manual refresh. Faculty and the department head can filter attendance by student, view individual timelines, and export data in CSV or PDF formats.

---

### Data Management, Security, and Privacy

FRAMES stores **embedding vectors only**—512-dimensional floating-point arrays (2,048 bytes each)—rather than raw facial images. This embedding-first approach reduces storage requirements, accelerates matching computations, and minimizes privacy risk. However, embeddings remain sensitive data, as inversion attacks can potentially reconstruct approximate facial images (Jasmine & Jasper, 2022; Kruglov, 2019).

Security measures implemented in FRAMES include:
- **SSL/TLS encryption** for database connections (Aiven PostgreSQL with SSL)
- **bcrypt password hashing** for user authentication
- **Environment variable management** for credentials
- **Role-based access control** restricting data visibility by user role (Student, Faculty, Department Head)
- **Pydantic input validation** preventing injection and malformed data attacks
- **Gesture gating** as a behavioral presentation attack detection (PAD) mechanism

Legal compliance is guided by the **Data Privacy Act of 2012 (Republic Act 10173)** and its implementing rules. The Act emphasizes:
- **Informed consent** — users explicitly agree to biometric data collection before enrollment
- **Purpose limitation** — attendance data is used strictly for attendance logging and reporting
- **Data subject rights** — individuals can request access, correction, or deletion of their records
- **Retention limits** — facial logs are retained for a defined period, after which they are purged

By combining embedding-based storage, encryption at rest and in transit, role-based access controls, and adherence to RA 10173, FRAMES ensures that attendance monitoring is accurate, secure, and legally compliant.

---

### Software Quality Standards for System Evaluation (ISO/IEC 25010)

ISO/IEC 25010:2023 defines a product quality model consisting of nine characteristics: Functional Suitability, Performance Efficiency, Compatibility, Interaction Capability, Reliability, Security, Maintainability, Flexibility, and Safety (ISO, 2023; Britton, 2021).

For this capstone, **five characteristics** most aligned with the system's goals are prioritized:

| Quality Characteristic | How Evaluated in FRAMES |
|------------------------|-----------------------|
| **Functional Suitability** | Recognition accuracy, correct gesture detection, accurate attendance logging |
| **Performance Efficiency** | System response time, recognition speed (~300–500ms target), dashboard load time |
| **Interaction Capability** | User surveys assessing ease of use, intuitiveness, and visual clarity |
| **Reliability** | Consistency of recognition, absence of duplicate/missing entries, system uptime |
| **Security** | Gesture-gated PAD, role-based access control, data privacy compliance |

Other characteristics—Compatibility, Maintainability, Flexibility, and Safety—are acknowledged as important for long-term deployment but fall outside the immediate scope of this capstone due to time constraints and prototype-level implementation.

---

## Related Studies

### Local Studies

Several attendance monitoring systems have been developed in the Philippines, demonstrating early adoption of facial recognition and embedded systems. However, existing works reveal limitations in hardware efficiency, anti-spoofing mechanisms, and multimodal fusion—gaps that this study addresses.

#### Tempus — A Facial Recognition Technology in Attendance Monitoring
Reynoso and Torres (2020) introduced Tempus, a Raspberry Pi 3-based attendance system using Haar cascade and LBPH (Local Binary Patterns Histograms) for recognition, integrated with an IoT reporting feature. The study reported approximately 83% accuracy and favorable usability ratings among faculty and staff. However, the system suffered from modest recognition accuracy, no reported runtime performance metrics, and the absence of presentation attack detection (PAD). FRAMES improves upon these gaps by adopting the Raspberry Pi 4 with InsightFace's `buffalo_sc` embeddings (~97.5% LFW accuracy) and gesture-gated PAD for stronger reliability.

#### Real-Time Class Attendance Monitoring Using Smart Face Recognition
Delos Trinos et al. (2019) presented a prototype using face recognition deployed during the IEEE HNICEM conference in Laoag, leveraging real-time video capture for automatic attendance logging. Although effective in controlled environments, the study did not address common Philippine constraints such as low lighting in classrooms or spoofing risks through photos and videos. These constraints motivate the inclusion of gesture gating in FRAMES.

#### YOLOv3 Inference Approach for Student Attendance
Alon et al. (2020) proposed a YOLOv3-based facial recognition attendance system to accelerate detection. While the model improved detection robustness compared to older methods, its implementation required higher-end computing resources, limiting deployment on cost-sensitive campuses. FRAMES addresses this by using InsightFace's lightweight `buffalo_sc` model (~7 MB total), which runs efficiently on the Raspberry Pi 4 without GPU acceleration.

#### QSUM-eASys: A Face Recognition Attendance and Web-Based Monitoring System
Domingo and Ladia (2024) developed QSUM-eASys for Quirino State University, integrating face recognition with a web dashboard for administrators. The system emphasized usability and centralized reporting but lacked runtime performance evaluation and spoof prevention measures. FRAMES embeds gesture-gated PAD and provides measurable performance metrics (recognition speed, FPS, latency) to address these gaps.

#### Summary of Gaps in Local Studies

Across the reviewed local studies, three consistent gaps emerge:

1. **No Presentation Attack Detection (PAD)** — none of the systems counter spoofing (e.g., printed photos, video replays)
2. **No gesture gating** — attendance is logged as soon as a face is detected, risking false positives and walk-by logging
3. **Limited runtime reporting** — FPS, latency, and resource profiling are rarely documented

FRAMES addresses all three gaps through gesture-gated multimodal authentication, InsightFace's `buffalo_sc` model optimized for edge deployment, and measurable performance benchmarks on the Raspberry Pi 4.

---

### Foreign Studies

#### Facial Recognition Using Raspberry Pi
Several international studies affirm the feasibility of Raspberry Pi as a low-cost platform for real-time attendance systems. Nadhan et al. (2022) introduced an automatic attendance monitoring framework that reduced manual workload without significant loss of recognition accuracy. Shabaneh et al. (2023) developed a Raspberry Pi-based classroom attendance system emphasizing edge processing and low power consumption. Uddin et al. (2021) proposed an AI-driven attendance system confirming the real-time capacity of lightweight pipelines on embedded devices. Panwar et al. (2024) integrated convolutional neural networks (CNNs) for face recognition attendance, achieving higher accuracy but at increased computational cost. Elnozahy et al. (2025) extended Raspberry Pi applications to secure access control, while Aboluhom and Kandilli (2025) demonstrated multitask classification capabilities (identity, age, ethnicity) on Pi hardware. Collectively, these works demonstrate that the Raspberry Pi can sustain recognition pipelines with adequate performance, though many overlook PAD, lighting variability, and runtime reporting.

#### Gesture-Controlled Recognition Systems
Yadav and Jain (2024) demonstrated a vision-based hand gesture recognition model for human–computer interaction achieving high accuracy and real-time performance. Dhananjay et al. (2024) applied gesture-driven interfaces to smart home automation using IoT devices. Muneeb, Rustam, and Jalal (2023) designed a gesture-based automation framework for elderly assistance using wearables and machine learning. These studies highlight that gesture recognition can improve automation in technology-driven environments, particularly where touchless operation is needed. However, many depend on resource-heavy algorithms or wearable sensors. FRAMES introduces lightweight MediaPipe-based gesture gating on the Raspberry Pi for attendance actions, making the system both accessible and portable.

#### Multimodal Attendance and Fusion Systems
Mohammad et al. (2024) proposed an embedded multimodal face recognition framework using MobileNetV2 and FaceNet on Raspberry Pi 400, achieving near real-time accuracy at approximately 12 frames per second. The AIP Advances study (2024) explored feature-level fusion of face and speech modalities, improving recognition reliability but requiring heavy computational resources unsuitable for edge devices. Reviews of hand gesture recognition from 2023–2024 stressed the efficiency of MediaPipe as a real-time pipeline suitable for both static and dynamic gesture tasks. FRAMES addresses the computational trade-off challenge by combining InsightFace's `buffalo_sc` facial recognition with MediaPipe gesture-based gating, balancing accuracy and resource efficiency on the Raspberry Pi 4.

---

## Conceptual Framework

### Input-Process-Output (IPO) Model

The conceptual framework of this study follows the Input-Process-Output (IPO) model to illustrate the system's development lifecycle and operational flow.

#### Input

The input phase establishes the system's foundation by identifying essential knowledge, software, and hardware requirements:

**Knowledge Requirements:**
- Facial recognition techniques using InsightFace (buffalo_sc model: SCRFD detection + MobileFaceNet recognition)
- Hand gesture recognition through MediaPipe Hands (static gesture detection with landmark-based classification)
- Web development with FastAPI (Python, async backend) and React (Vite, JSX frontend)
- Database management with PostgreSQL (Aiven Cloud, SSL)
- Compliance with the Data Privacy Act of 2012 (RA 10173)
- ISO/IEC 25010 Software Quality Model for system evaluation

**Software Requirements:**
- Raspberry Pi OS Bookworm 64-bit (edge device)
- Python 3.11+ with InsightFace, ONNX Runtime, MediaPipe, OpenCV
- FastAPI with SQLAlchemy 2.x ORM (backend)
- Vite + React 19.2 with Bootstrap 5.3, Axios, Chart.js/Recharts (frontend)
- PostgreSQL hosted on Aiven Cloud with SSL connectivity

**Hardware Requirements:**
- Raspberry Pi 4 Model B (4 GB RAM)
- USB webcam (720p, UVC-compliant, e.g., ICON 720p HD)
- 7-inch HDMI IPS kiosk display (1024×600)
- Keyboard and mouse (for initial setup)
- Power supply (5V 3A USB-C)
- Network connectivity (Wi-Fi or Ethernet)

#### Process

The process phase explains how the system was developed through three stages:

1. **Design** — The researchers designed the system architecture, including the two-pipeline model (enrollment on server, recognition on edge), dashboard wireframes for Student, Faculty, and Department Head modules, database schema, and kiosk UI layout. User flows for facial enrollment, attendance actions, and report generation were mapped.

2. **Create** — Implementation involved building the FastAPI backend with SQLAlchemy ORM, connecting to the PostgreSQL cloud database, developing the React-based frontend with Bootstrap for responsive design, integrating InsightFace's `buffalo_sc` for face enrollment and recognition, implementing MediaPipe Hands for gesture detection, and building the kiosk server for the Raspberry Pi with camera feed and real-time overlay.

3. **Test and Improve** — Testing included functional testing of face and gesture recognition accuracy, performance testing on the Raspberry Pi 4 (recognition speed, FPS, memory usage), integration testing between the kiosk, backend API, and web dashboard, and user acceptance testing with students, faculty, and the department head. The system was evaluated using the ISO/IEC 25010 Software Quality Model.

#### Output

The output is **FRAMES** — a web-based, gesture-gated facial recognition attendance system deployed on Raspberry Pi. The system automates attendance logging, provides contactless multimodal authentication (face + gesture), and delivers real-time attendance visualization and exportable reports through a responsive web dashboard.

#### Evaluation

The system is assessed using the **ISO/IEC 25010 Software Quality Model** focusing on Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security. Structured Likert-scale survey questionnaires are administered to students (~50), faculty (1), and the department head (1) after a one-day pilot deployment.

---

## Operational Definition of Terms

The following terms are defined as they are used in the context of this study:

**Anomaly Notification** — An alert generated by the kiosk when a detected face does not match any enrolled student in the currently scheduled class for that room. The individual is flagged as unrecognized and no attendance is logged.

**Attendance Tracking** — The automated recording of time-in (entry), break-out, break-in, and time-out (exit) logs of users, stored in the system's PostgreSQL database for reporting and monitoring. The system also supports an **early entry window** (recognizing users up to 10 minutes before class start) and an **auto-exit** mechanism (automatically closing open sessions at class end time).

**Break-In** — The action performed by a user when returning from a break period, confirmed through a thumbs-up gesture after facial recognition, updating the system to mark the user as present in the room.

**Break-Out** — The action performed by a user when leaving temporarily for a break, confirmed through a peace sign (two-finger) gesture, updating the system to mark the user as on break.

**Cosine Similarity** — A mathematical measure used to compare two face embeddings by computing the cosine of the angle between them. A score of 1.0 indicates identical vectors; the FRAMES match threshold is 0.30.

**Early Entry Window** — A configurable time buffer (default: 10 minutes) before the official class `start_time` during which the kiosk begins accepting attendance. Users recognized during this window are logged as ON TIME, since late-status is still computed against the official start time. This feature prevents congestion at the kiosk when many students arrive simultaneously just before class begins.

**Database (PostgreSQL)** — The cloud-hosted relational database (Aiven Cloud with SSL) that stores user profiles, 512-dimensional face embeddings, class schedules, enrollment records, device registrations, and attendance logs.

**Auto-Exit (AUTO_TIMEOUT)** — A system-initiated EXIT action logged automatically at the class `end_time` for all users whose attendance session is still open (i.e., who entered but did not manually exit). Auto-exit records are marked `verified_by = AUTO_TIMEOUT` and include a `[AUTO_EXIT]` remark to distinguish them from user-initiated exits. This ensures attendance logs are always complete even when users forget to perform the exit gesture.

**Depthwise Separable Convolution** — A neural network operation used in MobileFaceNet that decomposes standard convolutions into depthwise and pointwise steps, reducing computational cost by approximately 8–9× while preserving recognition accuracy.

**Embedded System** — A computing setup where hardware (Raspberry Pi 4, USB webcam, kiosk display) and software (InsightFace recognition, MediaPipe gesture detection, kiosk server) are integrated into a dedicated device that performs attendance monitoring tasks at the edge.

**Face Embeddings** — 512-dimensional normalized floating-point vectors extracted from aligned face crops by the MobileFaceNet model. Each embedding represents abstract facial features and occupies 2,048 bytes in database storage. No raw facial images are stored.

**Facial Recognition** — A biometric authentication process that identifies and verifies users based on unique facial features by extracting and comparing face embeddings. In FRAMES, it serves as the primary modality for identity validation.

**FastAPI** — An asynchronous Python web framework used as the FRAMES backend, providing high-performance API endpoints for authentication, face enrollment, attendance logging, schedule management, and report generation.

**Gesture Debouncing (Temporal Smoothing)** — A technique requiring consistent gesture detection across three consecutive frames before accepting the input, minimizing errors from random or unintentional hand movements.

**Gesture-Gated Logging** — A multimodal security feature in which attendance actions (break-out, break-in, exit) are only recorded after both facial recognition and a confirming hand gesture are detected, preventing accidental or walk-by attendance logging. Entry logging is automatic upon facial recognition.

**Hand Gesture Authentication** — A behavioral interaction process using MediaPipe Hands, where users perform specific static hand gestures (peace sign for break-out, thumbs-up for break-in, open palm for exit) to confirm attendance actions.

**InsightFace** — An open-source face analysis library providing pre-trained model packs for face detection, alignment, and recognition. FRAMES uses the `buffalo_sc` model pack.

**ISO/IEC 25010 Quality Model** — The international software quality evaluation framework used in this study, focusing on Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security.

**Kiosk** — A physical station consisting of a Raspberry Pi 4, USB webcam, and 7-inch HDMI display, mounted at the classroom entrance. It serves as the interaction point for students and faculty to perform facial recognition and gesture authentication during attendance logging.

**MediaPipe** — A cross-platform machine learning framework by Google used in FRAMES for two purposes: (1) BlazeFace pre-filter for fast face detection gating on the Raspberry Pi, and (2) Hands module for static hand gesture recognition.

**MobileFaceNet** — The recognition neural network within the `buffalo_sc` model pack, based on MobileNetV2 with depthwise separable convolutions, which converts 112×112 aligned face images into 512-dimensional embedding vectors.

**Modules (Student, Faculty, Department Head)** — The subsystems of the web platform tailored to user roles. The **Student Module** displays personal attendance records and real-time status. The **Faculty Module** enables class-level attendance monitoring, report generation, and student management. The **Department Head Module** extends the faculty role with department-wide oversight, faculty verification, and aggregated reports.

**Multimodal Authentication** — A security process requiring more than one biometric or behavioral input (face recognition + hand gesture) to validate attendance actions, reducing risks of spoofing and false logging.

**ONNX Runtime** — The inference engine used on the Raspberry Pi to execute InsightFace's pre-trained ONNX models (SCRFD detector and MobileFaceNet recognizer) on the ARM64 CPU.

**Presentation Attack Detection (PAD)** — Security measures designed to prevent spoofing attempts such as photo or video-based facial recognition bypass. In FRAMES, gesture confirmation acts as a behavioral PAD mechanism.

**Raspberry Pi 4 Model B** — A single-board computer with a quad-core ARM Cortex-A72 processor (1.5 GHz) and 4 GB LPDDR4 RAM, serving as the edge computing device for the FRAMES kiosk.

**Room Visualization** — A feature of the web dashboard that provides a real-time display of classroom occupancy, showing which students are currently inside the room, on break, or have exited, using color-coded status indicators (green = present, yellow = break).

**SCRFD** — Sample and Computation Redistribution for Efficient Face Detection; the lightweight face detection model within `buffalo_sc` that locates faces and extracts 5 facial landmarks for alignment.

**Smart Monitoring System** — The prototype designed and developed by the researchers, integrating Raspberry Pi–based facial recognition with InsightFace `buffalo_sc` and hand gesture authentication via MediaPipe, supported by a web dashboard for real-time attendance and occupancy monitoring.

**USB Webcam** — A Universal Video Class (UVC)-compliant camera connected to the Raspberry Pi via USB, providing 720p (1280×720) video capture at 30fps for face detection and recognition. The FRAMES team uses an ICON Camera 720p HD with 90° wide-angle field of view.

**Web-Based Dashboard** — The centralized platform developed with Vite + React (JSX) and Bootstrap 5.3, providing real-time data visualization, attendance reports, and role-based access for the department head, faculty, and students. The dashboard is mobile-responsive and accessible via standard web browsers.
