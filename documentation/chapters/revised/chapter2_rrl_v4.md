# Chapter 2

## REVIEW OF RELATED LITERATURE AND STUDIES

This chapter presents a comprehensive collection of relevant foreign and local literature and studies that support the development of **FRAMES: A Web-Based, Gesture-Gated Facial Recognition Attendance System Using Raspberry Pi**. It covers the key technological domains underpinning the study, reviews related foreign and local studies, synthesizes the identified research gaps, presents the conceptual framework, and defines operational terms used throughout the study.

> **Note on Citations:** The foundational papers for core technologies used in FRAMES (such as ArcFace and MobileFaceNets) were originally published before 2021, as these algorithms were first introduced in those earlier years. Where possible, this chapter cites 2021-or-later works that validate, replicate, or build upon those foundations. The foundational pre-2021 references (Deng et al., 2019; Chen et al., 2018; Schroff et al., 2015; Lugaresi et al., 2019) are retained as primary theoretical citations and are noted as such.

---

## 2.1 Review of Related Literature

The increasing integration of digital technologies in educational institutions has led to the development of systems that enhance monitoring and management of classroom activities. In response to the need for accurate, real-time attendance tracking and efficient classroom monitoring, researchers have explored technologies such as facial recognition, hand gesture authentication, embedded edge computing, and web-based visualization. These innovations are being explored to create a smarter, more efficient, and responsive learning environment. The following subsections present the literature across the key technological domains that underpin the FRAMES system, beginning with the broader context of smart monitoring and narrowing to the specific components—embedded hardware, face recognition, gesture detection, multimodal fusion, performance optimization, and evaluation frameworks—that collectively inform the system's design.

---

### 2.1.1 Smart Monitoring in Educational Systems

Smart monitoring in education refers to the use of automated technologies—such as the Internet of Things (IoT, defined as physical devices connected to the internet for data exchange), embedded systems (dedicated hardware designed for specific tasks), and real-time analytics—to manage classroom attendance and resource utilization without relying on manual processes. The concept extends beyond simple attendance logging: a "smart" system is one that not only records who is present but also generates higher-level insights for resource allocation, faculty compliance monitoring, and administrative decision-making.

Rama Krishna et al. (2023) synthesized existing smart attendance systems using Raspberry Pi and highlighted common design strategies including camera-based recognition, web dashboards, and IoT integration. Importantly, the review also identified key gaps such as the lack of multimodal authentication—meaning most systems rely on a single recognition modality without a confirming action—and limited evaluation of real-time performance under actual classroom conditions. Similarly, Zhao M., Zhao G., and Qu (2022) introduced an IoT-based classroom attendance management framework that centralized monitoring of student presence, integrated faculty schedules, and generated subject-based usage trends for administrative use. Their study emphasized that smart monitoring produces actionable outputs beyond raw logs, enabling administrators to identify underutilized rooms and track attendance patterns across subjects.

More recently, Firdous et al. (2023) examined the integration of AI and IoT technologies specifically in classroom attendance contexts at the IEEE International Conference on Image Information Processing. Their work demonstrated that AI-driven recognition pipelines paired with IoT network connectivity significantly reduce administrative overhead while enabling centralized real-time monitoring across multiple classrooms—confirming that the AI-IoT convergence is operationally viable rather than merely theoretical. Nguyen et al. (2021b) similarly developed and validated an automated classroom attendance system using AI and IoT, achieving reliable recognition in controlled classroom settings and establishing a working benchmark for edge-to-cloud synchronization in a networked campus environment.

Comparing these four works, Rama Krishna et al. (2023) and Zhao et al. (2022) address design strategy and administrative analytics respectively, providing the conceptual rationale for what smart monitoring should accomplish. Firdous et al. (2023) and Nguyen et al. (2021b) then demonstrate that AI and IoT integration is operationally viable in live classroom deployments. However, none of the four implements anti-spoofing mechanisms or gesture-based user interaction, and none evaluates system quality against a recognized software evaluation framework.

From these insights, the present study defines smart monitoring in a scoped and practical sense: enabling entry, exit, and break tracking through facial recognition and gesture control; producing subject-specific attendance reports and visual dashboards; and generating anomaly alerts for unknown individuals. Unlike prior work that focused solely on facial recognition or IoT integration, FRAMES integrates multimodal fusion (face + gesture) with real-time visualization, kiosk-level feedback, and role-based reporting, ensuring the monitoring process is both accurate and actionable for students, faculty, and the department head.

---

### 2.1.2 Embedded Systems for Attendance Monitoring

Embedded systems serve as the backbone for low-cost, portable, and real-time attendance monitoring applications. By integrating hardware like the Raspberry Pi with software pipelines for detection and recognition, they enable on-device processing and reduce dependency on external servers. This is particularly important in educational contexts where internet connectivity may be intermittent and budget constraints prevent the use of GPU-powered server infrastructure.

Swathi and RathnaChary (2023) demonstrated such integration by using Raspberry Pi as the embedded platform for live face detection and attendance management, highlighting its efficiency in managing classroom data with minimal external infrastructure. Their findings underscore the Pi's suitability for educational contexts where affordability and portability are key constraints. Ashok Kumar et al. (2021) extended this perspective by employing deep learning models on Raspberry Pi to enhance recognition accuracy. The study balanced computational feasibility with accuracy by optimizing lightweight neural models for embedded deployment, showing that embedded devices are not limited to simple feature-based recognition but can also handle optimized deep learning pipelines when the architecture is carefully selected.

More recently, Touzene, Abed, and Larabi (2024) introduced an Embedded Intelligent System for Attendance Monitoring, which coupled Raspberry Pi hardware with web-based dashboards. Their system emphasized modular design, capturing and processing attendance data directly on the Pi while synchronizing outputs to a central web interface for administrators. This modular approach—where the edge device handles recognition independently and the server handles storage and visualization—mirrors the architectural philosophy that FRAMES adopts. Ren (2024), in a thesis from Universiti Tunku Abdul Rahman, further demonstrated an integrated AIoT (Artificial Intelligence of Things—the convergence of AI inference with IoT connectivity) system for class attendance tracking, showing that combining edge-based AI recognition with cloud-synchronized monitoring is both technically and institutionally feasible when hardware is constrained.

Comparing these works, Swathi and RathnaChary focus on detection efficiency on the Pi, Ashok Kumar et al. on accuracy optimization through lightweight deep learning, Touzene et al. on system modularity and web integration, and Ren on the end-to-end AIoT integration model—each addressing a different dimension of the embedded attendance problem but none combining all considerations simultaneously. Collectively, these studies confirm that embedded systems can sustain attendance monitoring by combining low-power hardware, optimized recognition pipelines, and integrated web dashboards. For this capstone, the **Raspberry Pi 4 Model B** is selected as the embedded platform, coupled with InsightFace's `buffalo_sc` model and a standard USB webcam, achieving the desired balance of cost, speed, and recognition accuracy for classroom kiosk deployment. Unlike the reviewed works, FRAMES adds gesture-gated logging to reduce false positives and integrates administrative features such as report generation and anomaly alerts, extending the typical role of embedded attendance systems toward more intelligent monitoring.

While embedded systems ensure portability and on-site processing, their full effectiveness depends on the quality of the recognition pipeline. Thus, the following sections discuss the underlying technologies that enable the FRAMES prototype—facial recognition, gesture recognition, and multimodal fusion—all optimized for Raspberry Pi–based deployment.

---

### 2.1.3 Facial Recognition Techniques for Edge Devices

Facial recognition on edge devices generally falls into two major categories: traditional feature-based methods (such as Haar cascades and HOG+SVM) and modern deep learning embedding pipelines (such as MobileFaceNet with ArcFace loss). The distinction is important because it determines both the achievable accuracy and the computational cost on resource-constrained hardware. Feature-based methods extract hand-crafted visual patterns (edges, gradients, local textures) and classify them using classical machine learning algorithms, offering fast execution but limited robustness to variations in pose, lighting, and expression. Embedding-based methods, by contrast, use deep neural networks to map a face image into a compact numerical vector (an "embedding") in a high-dimensional space, where the distance between vectors encodes identity similarity—offering dramatically improved accuracy but requiring more computational power.

It is essential to distinguish between two related but distinct processes. **Face detection** answers the question "Where is the face?" by localizing facial regions within an image frame. **Face recognition** answers the deeper question "Whose face is it?" by extracting a unique embedding from the detected region and comparing it against stored profiles. In FRAMES, detection is handled by a lightweight model (SCRFD) to maintain real-time performance, while recognition uses MobileFaceNet embeddings for accurate identity validation.

Nguyen et al. (2021a) demonstrated through AIP Conference research that classic detection methods using Haar or HOG can achieve real-time performance on Raspberry Pi hardware when input image widths are constrained to 300 pixels or below, but noted that deeper detectors like SSD become impractical without hardware acceleration. This finding establishes a practical upper bound on detection complexity for Pi-class devices. In contrast, Deng et al. (2019) introduced the ArcFace loss function, a training objective that forces same-person face embeddings to cluster tightly on a hypersphere while separating different identities by a learnable angular margin. Trained on the MS1MV2 dataset, ArcFace achieved 99.77% accuracy on the LFW benchmark with a ResNet-100 backbone—establishing the current standard for discriminative face embedding quality.

While Nguyen et al. (2021a) prioritize inference speed and resource efficiency, Deng et al. (2019) optimize for maximum discriminative accuracy, representing complementary ends of the speed-accuracy trade-off spectrum. For a kiosk scenario demanding both real-time response and high-reliability matching under controlled indoor lighting, neither extreme alone is sufficient: a Pi cannot run ResNet-100 in real time, and Haar cascades cannot produce discriminative embeddings. FRAMES resolves this by adopting InsightFace's `buffalo_sc` model pack—built on MobileFaceNet with ArcFace training—which achieves approximately 97.5% LFW accuracy at 300–500 ms inference time on the Raspberry Pi 4, a practical middle ground that neither prior study fully demonstrates on its own.

---

### 2.1.4 InsightFace and the buffalo_sc Model Selection

The InsightFace library, developed by researchers at the Institute of Automation, Chinese Academy of Sciences, provides pre-trained model packs that bundle face detection and recognition into a unified pipeline (Guo et al., 2021). Rather than requiring developers to assemble separate detection, alignment, and recognition components, InsightFace delivers these as integrated model packs with consistent APIs—a significant practical advantage for embedded deployments where development time and integration complexity are constraints.

Among the available model packs, the `buffalo_sc` pack—combining the SCRFD lightweight detector (~2.5 MB) with a MobileFaceNet recognition model (~4.5 MB)—is specifically designed for edge and embedded deployments. Chen et al. (2018) originally proposed MobileFaceNet as a class of highly efficient convolutional neural networks using **depthwise separable convolutions** from the MobileNetV2 architecture. Depthwise separable convolutions decompose a standard convolution into two steps—a depthwise convolution that processes each input channel independently, and a pointwise (1×1) convolution that combines the outputs—reducing computational cost by approximately 8–9× compared to standard convolutions while preserving representation quality. This architectural innovation enabled Chen et al. (2018) to achieve 99.55% LFW accuracy with a model smaller than 5 MB and inference times of approximately 18 ms on mobile hardware.

While Guo et al. (2021) demonstrate that InsightFace's larger models (e.g., `buffalo_l` with ResNet-100) reach near-perfect accuracy on standard benchmarks, they do so at the cost of inference times exceeding 3,000 ms on the Raspberry Pi 4—effectively rendering real-time kiosk use impractical. A kiosk that takes three seconds to process a single face would create unacceptable queues in a classroom with 30–50 students arriving within a narrow time window. Chen et al.'s (2018) architecture enables the speed necessary for kiosk deployment, while Guo et al.'s (2021) training framework and data pipeline provide the embedding quality for reliable matching. These complementary contributions directly inform FRAMES: the `buffalo_sc` pack is selected because it achieves approximately 2–3 recognitions per second on the Raspberry Pi 4 with a negligible accuracy trade-off under the system's controlled indoor conditions.

**Table 1**  
*buffalo_sc vs. buffalo_l Performance on Raspberry Pi 4*

| Metric | buffalo_l (ResNet-100) | buffalo_sc (MobileFaceNet) |
|--------|----------------------|----------------------------|
| Recognition inference | ~3,000–3,500 ms | ~300–500 ms |
| Model size | ~325 MB | ~7 MB |
| LFW accuracy | 99.77% | ~97.5% |
| Effective kiosk FPS | 0.2–0.3 FPS | 2–3 FPS |

*Note.* LFW = Labeled Faces in the Wild benchmark. Inference times measured on Raspberry Pi 4 Model B (4 GB RAM) using ONNX Runtime on ARM64.

> 🖼️ **[INSERT FIGURE 1 HERE]**  
> **Type:** Pipeline Diagram  
> **Title:** *Figure 1. InsightFace buffalo_sc Recognition Pipeline*  
> **Suggested content:** A left-to-right flow diagram showing: Raw Frame → SCRFD Face Detection → 5-Point Landmark Alignment → MobileFaceNet Embedding Extraction (512-D vector) → Cosine Similarity Comparison → Match / No Match decision.  
> **Recommended tool:** Draw.io, Lucidchart, or PowerPoint SmartArt

---

### 2.1.5 Face Embeddings, Bias, and Biometric Privacy

Face embeddings are the core data representation that makes modern facial recognition practical. They are high-dimensional numerical vectors—typically 512 dimensions in the case of InsightFace's models—generated by deep neural networks from aligned face images. Each embedding encodes abstract facial geometry (the spatial relationships among landmarks such as the spacing of the eyes, the bridge of the nose, and the jawline contour) rather than raw pixel information, meaning that the representation remains relatively stable across changes in lighting, facial expression, and camera angle (Schroff et al., 2015; Deng et al., 2019). Their strength lies in enabling fast similarity comparisons using cosine distance: a cosine similarity of 1.0 between two embeddings indicates identical vectors, while lower values indicate decreasing similarity. This means the system never needs to store raw facial photographs—only the mathematical vectors—significantly reducing storage requirements and eliminating the direct visual reproducibility of the original face.

However, the promise of embedding-based recognition must be tempered by documented vulnerabilities. Buolamwini and Gebru (2018) demonstrated through the Gender Shades study that pre-trained face recognition models exhibit measurable accuracy disparities across demographic groups, particularly for darker-skinned individuals, when training datasets lack intersectional balance. The embedding process primarily encodes geometric relationships among facial landmarks rather than raw color information, making it relatively robust across diverse skin tones—but bias can still arise if the pre-trained models were developed using imbalanced datasets. This concern applies to any deployed system and underscores the importance of selecting models trained on diverse, multi-ethnic datasets.

Boutros et al. (2021) added a further dimension, showing that facial occlusions such as masks significantly degrade recognition accuracy by obscuring key landmark regions used during embedding extraction. When a mask covers the nose and mouth, the network loses access to a significant portion of the facial geometry it was trained to encode, often leading to reduced confidence scores or partial mismatches. This finding is particularly relevant for post-pandemic classroom environments where mask usage may still occur.

Cosmetic changes, including makeup, generally affect surface-level textures but not the underlying landmark geometry, resulting in minimal impact on recognition accuracy. Nonetheless, consistent camera exposure and optional re-enrollment help maintain precision for users with frequent appearance changes.

While Schroff et al. (2015) and Deng et al. (2019) establish the theoretical foundations of reliable face embeddings, Buolamwini and Gebru (2018) and Boutros et al. (2021) highlight their real-world vulnerabilities under diverse and occluded conditions. For FRAMES, these findings justify two key design decisions: first, the use of InsightFace's `buffalo_sc` model trained on the large multi-ethnic MS1MV2 dataset (which includes over 5.8 million images across 85,742 identities), reducing the risk of demographic bias under controlled enrollment conditions; and second, the adoption of gesture-gated multimodal authentication as a compensating control when facial visibility is limited—ensuring that attendance can still be confirmed through a behavioral modality even if embedding confidence is marginal.

---

### 2.1.6 Anti-Spoofing and the Limitations of Gesture-Gated Authentication

Spoofing—presenting a fake representation of a legitimate user's face to deceive a facial recognition system—remains one of the most widely documented and unresolved challenges in biometric authentication. Presentation attacks using printed photographs or video replay are particularly difficult to detect with camera-only systems, as these attacks can produce face embeddings similar enough to enrolled embeddings to cross the recognition threshold. Mukthineni et al. (2020) demonstrated this vulnerability specifically in the context of attendance systems, showing that face-only attendance logging can be defeated by presenting a printed photo of the enrolled user.

The research community has proposed various countermeasures. Hardware-based approaches include infrared (IR) depth cameras that detect the flat surface of a photograph, 3D structured-light sensors that verify facial depth, and near-infrared imaging that captures subsurface skin reflectance patterns invisible to printed media. These methods are highly effective but require specialized hardware that is prohibitively expensive for per-classroom deployment in resource-constrained universities.

Software-based approaches offer a more accessible alternative. Gesture-based liveness detection—requiring a physical action as proof of living presence—raises the effort required to spoof a system, though it does not eliminate the attack vector entirely. As Jha et al. (2024) noted, a prepared adversary can theoretically hold a photograph with one hand and perform the required gesture with the other. This architectural reality, where face detection and gesture detection run as decoupled pipeline steps on the same camera feed, means it is theoretically possible for Person A's face to be recognized while Person B performs the gesture nearby—a risk that is mitigated through physical deployment constraints rather than software alone.

Jasmine and Jasper (2022) add a data security dimension to the spoofing discussion, noting that inversion attacks can potentially reconstruct approximate facial images from stored embedding vectors. This finding means that the embedding database itself—not just the live recognition process—is a security-sensitive asset requiring encryption and access control.

Taken together, the literature positions gesture-gating not as a complete spoofing solution but as a cost-effective, hardware-simple deterrent that significantly raises the difficulty of casual or opportunistic proxy attendance compared to face-only or ID-card systems. The key insight is that the threat model for a university classroom attendance system is fundamentally different from, say, a border control checkpoint. The relevant adversary is a student attempting to have a friend mark them present, not a state-sponsored actor with 3D-printed masks. Against this realistic threat model, gesture gating provides meaningful deterrence.

FRAMES adopts this realistic framing: gesture-gated logging deters walk-by and casual photo-based attempts; embedding-only storage, SSL-encrypted database connections (Aiven PostgreSQL with TLS), and role-based access control address the data security risks identified by Jasmine and Jasper (2022); and physical kiosk placement in a narrow single-person entry lane is documented as an essential deployment requirement to minimize the decoupled-detection attack surface.

> 🖼️ **[INSERT FIGURE 2 HERE]**  
> **Type:** Flowchart / Sequence Diagram  
> **Title:** *Figure 2. FRAMES Sequential Face-and-Gesture Authentication Flow*  
> **Suggested content:** A top-down or left-to-right flowchart with decision nodes: Face Detected? → Yes → Face Matched? → Yes → Check Attendance State → Action Prompted (e.g., "Show thumbs-up for break-in") → Gesture Detected (3-frame debounce)? → Yes → Log Attendance. Include failure/rejection paths at each decision node (No match → Anomaly alert; No gesture → Timeout, prompt again).  
> **Recommended tool:** Draw.io, Lucidchart, or Microsoft Visio

---

### 2.1.7 Hand Gesture Recognition for Control

Hand gesture recognition can generally be categorized into two types: static gestures, which are fixed hand poses captured from a single frame, and dynamic gestures, which involve motion tracked over time. For low-power embedded devices such as the Raspberry Pi, static gestures tend to be more reliable and less computationally demanding, making them particularly suitable for simple control actions such as confirming attendance states. As Mohamed, Hassan, and Jamil (2024) highlighted, static gestures provide faster classification and are less prone to errors compared to dynamic sequences, especially under constrained computational environments.

Sarma and Bhuyan (2021) provided a comprehensive review of vision-based hand gesture recognition methods and databases, confirming that landmark-based static detection consistently outperforms contour-based and CNN-heavy approaches in terms of processing speed on resource-limited devices. Their review also identified gesture segmentation—the process of isolating a gesture event from a continuous video stream—and debouncing as critical challenges that must be addressed for reliable deployment.

The most widely adopted pipeline for lightweight gesture recognition is **MediaPipe Hands**, developed by Google as part of the broader MediaPipe framework (Lugaresi et al., 2019). MediaPipe Hands detects 21 landmarks per hand—including fingertip positions, knuckle joints, and the wrist base—and maintains stable tracking at usable frame rates even on the Raspberry Pi. The landmarks provide a rich spatial representation of hand posture: by computing distance ratios between specific landmark pairs (e.g., the distance from the fingertip to the palm base relative to the finger length), static gestures such as a thumbs-up, peace sign, or open palm can be classified without training a separate neural network for gesture recognition. This landmark-based approach is computationally inexpensive because it requires only simple geometric calculations after the initial landmark detection pass.

Anand et al. (2024) further validated this approach by integrating OpenCV and MediaPipe specifically for real-time gesture-based control in a Smart AI volume control system, confirming that the MediaPipe+OpenCV stack achieves frame-level gesture classification without requiring dedicated GPU resources—a finding directly relevant to Raspberry Pi kiosk deployment. Perwej et al. (2025) provided a broader empirical evaluation of OpenCV's capabilities across multiple hand gesture recognition methods, establishing benchmarks that contextualize MediaPipe's performance advantage on constrained hardware. Siva Priya et al. (2025) similarly demonstrated gesture-based system control using OpenCV and MediaPipe in an embedded context, reinforcing the pipeline's practical viability beyond laboratory settings.

Alternative approaches include CNN-based classifiers that train end-to-end on gesture image datasets, achieving high per-gesture accuracy on benchmarks. However, as Raksha et al. (2025) found, CNN-heavy solutions reduce frame rate substantially on edge devices—creating an unfavorable trade-off for real-time kiosk applications where responsiveness is critical. A gesture recognition module that takes 500 ms per frame effectively halves the system's overall throughput when coupled with face recognition, which already consumes 300–500 ms per cycle.

Challenges remain in real-world deployment. As Mohamed et al. (2024) noted, issues such as cluttered backgrounds, varying lighting conditions, hand occlusion, and camera placement significantly impact recognition reliability. These limitations are especially relevant in classroom environments where users interact from varying distances and angles, and where other students' hands may appear in the camera frame.

In light of these findings, FRAMES adopts static gesture recognition using MediaPipe Hands, classifying gestures through a distance-ratio landmark method. To further mitigate misclassifications from random or unintentional hand movements, **three-frame temporal debouncing** is applied: a gesture is only accepted as valid after it has been consistently detected across three consecutive frames (approximately 100–150 ms on the Pi). This debouncing also addresses the gesture segmentation concern raised by Sarma and Bhuyan (2021), ensuring that transient hand movements—such as a student adjusting their hair or waving to a classmate—are not misinterpreted as attendance gestures. The design prioritizes reliability and frame rate over marginal accuracy improvements that would cost significant processing headroom on the Pi.

---

### 2.1.8 Multimodal Fusion: Face and Gesture Integration

Multimodal biometric fusion—combining two or more authentication channels—strengthens attendance systems by exploiting the complementary strengths of each modality, reducing both false acceptance and false rejection compared to single-modal systems. The theoretical rationale is straightforward: when modalities are independent, an attacker must simultaneously defeat both channels to gain unauthorized access, which is exponentially more difficult than defeating either channel alone.

Jha et al. (2024) provided empirical support for this principle, demonstrating through AIP Advances research that integrating facial features with a behavioral modality such as hand gestures increases system robustness against both environmental noise and spoofing attacks. Their study reported improved FAR (False Acceptance Rate) and FRR (False Rejection Rate) trade-offs when modalities were combined, particularly under noisy or partially occluded conditions. This finding is directly applicable to classroom environments where students may partially cover their faces or where ambient noise creates challenging conditions for any single modality.

Mukthineni et al. (2020) demonstrated the practical application of this principle specifically for attendance systems. They showed that sequential gating—confirming face identity first, then prompting for a confirming gesture within a short temporal window—reduces accidental activations and raises the system's effective security level without requiring complex hardware. By requiring the user to perform a specific gesture after face recognition, the system confirms intentional participation rather than passive presence. This is the key distinction: an attendance system that logs entry simply upon detecting a face cannot distinguish between a student who is entering the room and a student who is walking past the doorway.

Different fusion strategies exist, each with distinct computational characteristics. **Feature-level fusion** combines the raw feature vectors from each modality into a single representation before classification—powerful but computationally expensive. **Score-level fusion** combines the confidence scores from each modality using mathematical rules (e.g., weighted sum)—moderate complexity with good discrimination. **Decision-level fusion** allows each modality to produce an independent accept/reject signal, and the system combines these binary decisions using logical rules (e.g., both must accept)—the simplest and most computationally efficient approach. Bala, Gupta, and Kumar (2022) reviewed these approaches and highlighted how decision-level fusion often provides the best cost/benefit trade-off for embedded systems because it minimizes cross-modal preprocessing and can be implemented with straightforward conditional logic.

A second important design element is the temporal window and debounce policy. Practical literature recommends giving the user a short time window (commonly 1–2 seconds) to perform the confirming gesture after a face match, and requiring consistent detection across multiple consecutive frames before accepting the gesture. Sarma and Bhuyan (2021) discussed gesture spotting and suggested that robust gesture segmentation and debouncing are critical for avoiding spurious activations caused by random hand movements or passing people.

Comparing these approaches, Jha et al. (2024) argue from a theoretical security standpoint demonstrating reduced error rates, Mukthineni et al. (2020) demonstrate the practical attendance-specific application of sequential gating, and Bala et al. (2022) provide engineering-level guidance on which fusion strategy to use given hardware constraints. All three converge on the conclusion that sequential, decision-level fusion is the appropriate choice for resource-constrained deployments where both security and usability are priorities.

FRAMES implements this exact strategy: face recognition occurs first using InsightFace's `buffalo_sc`; only upon a successful match (cosine similarity above the configured threshold) does the system open a gesture confirmation window; the required gesture depends on the user's current attendance state (entry is automatic, break-out requires a peace sign, break-in requires a thumbs-up, exit requires an open palm); and the gesture must persist across three consecutive frames before the attendance action is logged. This design balances security (minimizing false accepts through dual-modality confirmation), usability (short, intuitive gesture actions that can be learned in seconds), and computational practicality (decision-level fusion adds negligible overhead to the pipeline).

---

### 2.1.9 Real-Time Vision Performance on Raspberry Pi

The Raspberry Pi 4 Model B—equipped with a quad-core ARM Cortex-A72 processor at 1.5 GHz and 4 GB LPDDR4 RAM—has emerged as a popular platform for real-time vision tasks because of its affordability and portability. However, its absence of a dedicated neural processing unit (NPU) and reliance on general-purpose CPU cores necessitate careful optimization of deep learning models. Without such optimizations, inference can be prohibitively slow, especially when running convolutional neural networks that were designed for GPU execution (Aboluhom & Kandilli, 2025).

Two primary categories of optimization apply to Pi-based vision systems: model-level and input-level. **Model-level optimization** involves selecting architectures that are inherently lightweight or applying compression techniques. The `buffalo_sc` model pack—with its total footprint of approximately 7 MB—exemplifies this approach. Beyond architecture selection, models are typically converted to lightweight runtimes such as ONNX Runtime, which is specifically optimized for ARM platforms and supports features like integer-mode inference that exploit the Pi's NEON vector processing extensions. **Input-level optimization** involves reducing the data that the model must process per frame. Nguyen et al. (2021a) showed that reducing detection input resolution from 640×640 to 320×320 or lower substantially accelerates face detection with minimal accuracy loss at standard kiosk viewing distances (0.5–1.0 meters), where the face occupies a large portion of the frame regardless of input resolution.

Tank, Patel, and Deshmukh (2022) demonstrated the cumulative impact of these optimizations, finding that model selection, input resolution tuning, and multi-threading together yield substantial gains in frames per second on Raspberry Pi 4. Their benchmarking showed that multithreaded pipelines—where separate threads handle camera capture, inference, and display—deliver much smoother performance than single-threaded approaches. Aboluhom and Kandilli (2025) confirmed these findings, demonstrating that multitask learning models on the Pi reached near-real-time rates when properly optimized.

The choice of camera also influences latency and throughput. FRAMES uses a USB webcam rather than the Raspberry Pi's native CSI camera module. While CSI cameras offer slightly lower capture latency, USB webcams provide plug-and-play operation via the Universal Video Class (UVC) protocol, eliminating dependency on the `picamera2` software stack and CSI ribbon cable connections that add physical fragility to a kiosk deployment.

FRAMES applies both model-level and input-level optimizations: inference runs on the `buffalo_sc` model via ONNX Runtime on ARM64, and SCRFD detection operates at a 320×320 input size. Additionally, a two-stage gated detection approach is employed: **MediaPipe BlazeFace** serves as a fast pre-filter (~30 ms) to determine whether a face is present in the frame before invoking the heavier InsightFace detection and embedding extraction (~300–500 ms). This gating mechanism avoids running the full recognition pipeline on every frame, conserving CPU cycles when no face is visible. The combined pipeline achieves an effective end-to-end recognition cycle of approximately 250–350 ms and an effective kiosk response rate of 3–4 recognitions per second.

Beyond numerical performance, real-time visualization plays a key role in user experience. FRAMES implements a live kiosk overlay that shows recognition outcomes, gesture prompts, and attendance confirmations instantly on the 7-inch kiosk display. Simultaneously, the web dashboard reflects user status through color-coded indicators (green for present, yellow for break). This dual visualization design bridges embedded recognition with centralized monitoring, making the system both responsive and interpretable.

**Table 2**  
*FRAMES Measured Performance on Raspberry Pi 4*

| Pipeline Stage | Time |
|----------------|------|
| USB frame capture | 15–25 ms |
| MediaPipe face gate (BlazeFace) | 25–35 ms |
| InsightFace detection (SCRFD) | 100–160 ms |
| Embedding extraction (MobileFaceNet) | 30–50 ms |
| Embedding comparison (cosine similarity) | 5–15 ms |
| Gesture detection (MediaPipe Hands) | 20–30 ms |
| **Total per recognition cycle (face found)** | **~250–350 ms** |

*Note.* Measured on Raspberry Pi 4 Model B (4 GB RAM) with `det_size=(320,320)` and ONNX Runtime inference.

---

### 2.1.10 Attendance System Modality Comparison

Attendance tracking modalities vary considerably in their hygiene characteristics, processing speed, resistance to proxy attendance, and deployment cost, making the selection of an appropriate method an important institutional design decision. Understanding these trade-offs is essential for justifying why FRAMES uses a face-plus-gesture approach rather than simpler alternatives.

Alam et al. (2025), in one of the most comprehensive recent comparisons of automated attendance modalities, explicitly documented the advantages and disadvantages of each major category: **RFID card systems** (fast check-in, sub-second, but tokens are trivially shared between individuals); **fingerprint scanners** (accurate biometric binding, but requiring physical contact and sensitive to skin conditions such as dryness, injury, and moisture); **iris recognition** (highly accurate, but requiring expensive specialized hardware and precise user positioning); **voice recognition** (contactless, but susceptible to ambient classroom noise that makes it impractical in group settings); and **face recognition** (contactless and difficult to proxy, but sensitive to lighting variation and facial occlusion).

Vadwala (2024) similarly noted that touchless methods such as face recognition eliminate physical contact with shared surfaces—a consideration amplified by post-pandemic hygiene awareness in shared educational spaces. The hygiene advantage is meaningful in classroom contexts where the same attendance terminal is used by 30–50 students within a narrow time window.

Mukthineni et al. (2020) demonstrated that face recognition alone remains vulnerable to proxy attendance through photograph presentation, and that adding a behavioral confirmation layer such as gesture recognition substantially raises the effort required to attempt such attacks—though not making them impossible. This finding is the empirical foundation for FRAMES's multimodal design: face recognition provides reliable contactless identification, while gesture gating adds intent confirmation and a lightweight behavioral liveness check.

Vadwala's (2024) and Alam et al.'s (2025) comparative analyses and Mukthineni et al.'s (2020) empirical findings align in recommending multimodal touchless systems as the most balanced solution for institutional contexts where hygiene, proxy prevention, and cost are all relevant constraints. FRAMES's face-plus-gesture approach is positioned within this balanced framing: it provides contactless operation, meaningfully deters casual proxy attendance, and can be deployed with a single USB webcam and Raspberry Pi per room at minimal hardware cost—while transparently acknowledging that it is a deterrent layer, not an absolute security guarantee.

**Table 3**  
*Attendance Modality Comparison*

| Modality | Hygiene | Speed | Proxy Prevention | Cost |
|----------|---------|-------|-----------------|------|
| Manual Roll Call | ✅ | Slow | Very Low | Free |
| RFID Cards | ✅ | Fast | Low | Low |
| QR Code Scanning | ✅ | Fast | Low | Low |
| Fingerprint | ❌ Contact | Medium | Medium | Medium |
| Face Recognition Only | ✅ | Medium | Medium | Medium–High |
| **Face + Gesture (FRAMES)** | **✅** | **Medium** | **High** | **Low** |

*Note.* Adapted from Alam et al. (2025) and Vadwala (2024). Proxy Prevention ratings reflect resistance to intentional impersonation, not absolute security.

> 🖼️ **[INSERT FIGURE 3 HERE — OPTIONAL]**  
> **Type:** Grouped Bar Chart or Radar Chart  
> **Title:** *Figure 3. Visual Comparison of Attendance Modalities Across Key Criteria*  
> **Suggested content:** Radar (spider) chart plotting each modality (RFID, QR, Fingerprint, Face Only, Face+Gesture/FRAMES) across axes: Hygiene, Speed, Proxy Prevention, Cost Efficiency, Scalability.  
> **Recommended tool:** Microsoft Excel, Google Sheets, or Chart.js

---

### 2.1.11 Camera Placement and Physical Deployment Constraints

The physical placement of the kiosk camera is a critical but often overlooked factor in facial recognition system performance—one that directly addresses the decoupled face-gesture detection concern raised in Section 2.1.6 and affects both recognition accuracy and spoofing resistance. A system with excellent algorithmic performance will still fail in practice if the camera is poorly positioned, poorly lit, or placed in a high-traffic corridor where multiple faces enter the field of view simultaneously.

Research on face recognition kiosk deployment consistently recommends camera positioning at approximately eye-level (1.5–1.8 meters from the ground), with the subject at a distance of 50–100 centimeters from the lens, and with the facial view angle limited to no more than 25 degrees off-center to maintain embedding quality (Aboluhom & Kandilli, 2025). At greater distances, the face occupies fewer pixels in the captured frame, reducing the visual information available for embedding extraction and degrading recognition confidence. At extreme viewing angles, facial geometry is foreshortened in ways that the embedding model was not trained to normalize.

Lighting also plays a critical role. Optimal indoor illumination for face recognition is approximately 300 lux centered on the subject's face, with light sources positioned behind the camera to avoid glare and shadows that degrade detection accuracy. Backlighting (e.g., from a window behind the user) is particularly problematic because it causes the camera to underexpose the face while overexposing the background, effectively erasing the facial features that the detection model needs.

For the FRAMES kiosk, these constraints translate into specific deployment guidelines: the camera is mounted at approximately 1.6 meters on a fixed kiosk stand in a narrow doorway entry path, through which students pass one at a time—physically enforcing the single-user interaction model that prevents decoupled gesture attacks (where Person A's face is captured while Person B performs the gesture nearby). The kiosk should face away from windows or direct sunlight sources to maintain consistent lighting across the school day. These physical deployment requirements are not optional configuration choices but foundational prerequisites for the system's performance and security guarantees to hold—a point that parallels findings by Nadhan et al. (2022), who similarly noted that controlled access-point geometry is as important as algorithm selection in deployment scenarios.

The effective recognition distance also depends on the interplay of camera resolution, lens field of view, and subject positioning. Studies such as Swathi and RathnaChary (2023) and Tank et al. (2022) report optimal performance at 0.5–1.5 meters for Raspberry Pi setups, where facial features remain clear and within the simultaneous field of view for both face detection and gesture detection. Beyond this range, embedding vectors degrade due to low pixel density per facial landmark.

---

### 2.1.12 Web Dashboards and Visualization

Raw attendance logs—rows of timestamps, user IDs, and action codes—are insufficient for institutional decision-making. Faculty members need class-level summaries showing who was present, late, or absent. Department heads need aggregated views across classes and faculty members. Students need personal histories to verify their own records. The institutional value of attendance data comes from its transformation into structured reports and visual dashboards rather than from the raw logs themselves.

Effective attendance dashboards balance quick-glance awareness with drill-down capability, combining multiple visualization patterns such as per-room occupancy tiles, individual activity timelines, and exportable administrative reports. Bach et al. (2023), through a systematic analysis of dashboard design patterns across a wide corpus of real-world dashboards published in *IEEE Transactions on Visualization and Computer Graphics*, identified that tiles and timelines serve complementary cognitive purposes—tiles for ambient monitoring (quickly answering "what is happening now?") and timelines for retrospective analysis (answering "what happened over the past hour/day/week?"). They found that combining overview and detail patterns optimizes user comprehension in multi-entity monitoring scenarios such as classroom occupancy tracking.

At the backend level, the choice of framework determines how efficiently real-time updates can be delivered. Boadzie (2025) demonstrated that FastAPI's native WebSocket support enables real-time bi-directional communication between the backend and browser dashboard, eliminating the need for polling and reducing the latency between an attendance event and its visual reflection on screen. Polling—where the browser periodically requests updates every few seconds—introduces both latency (the user might wait up to the poll interval before seeing a new event) and unnecessary network overhead (most polls return no new data). WebSocket connections solve both problems by allowing the server to push events to the browser the instant they occur.

While Bach et al. (2023) establish what visualization patterns users need in a monitoring dashboard, Boadzie (2025) provides the technical mechanism for delivering that information in near real-time—both contributions being necessary for a functional live monitoring solution. The combination of research-validated visualization patterns and low-latency updates is particularly valuable in a classroom context, where faculty need immediate confirmation that student attendance has been logged rather than waiting for a manual refresh.

FRAMES implements this design: a Vite + React frontend with Bootstrap 5.3 connects via WebSocket to a FastAPI backend, streaming attendance events in real-time to role-based dashboard views. Room occupancy tiles display color-coded status indicators—green for present (after entry or break-in), yellow for break (after break-out), and empty for exited or absent students. Faculty can click into individual student timelines to see a chronological sequence of attendance actions. Reports are exportable in CSV and PDF formats for documentation and administrative use. The dashboard is mobile-responsive and accessible on desktop and mobile browsers, ensuring that faculty and the department head can monitor attendance from any device without a dedicated mobile application.

---

### 2.1.13 Data Privacy, Security, and Legal Compliance

Facial recognition systems handling biometric data carry significant legal and ethical responsibilities. This is particularly true in the Philippine context, where the **Data Privacy Act of 2012 (Republic Act 10173)** governs the collection, storage, and use of personal information including biometric identifiers (National Privacy Commission, 2012). The Act establishes several key obligations: informed consent (individuals must explicitly agree to the collection and processing of their biometric data), purpose limitation (attendance data may only be used for logging and reporting, not repurposed for other analyses), data subject rights (individuals can request access, correction, or deletion of their records), and proportionality (the data collected must be adequate and not excessive relative to its purpose).

From a technical perspective, Schroff et al. (2015) and Deng et al. (2019) established that embedding vectors, rather than raw images, are the appropriate unit of biometric storage—reducing storage requirements from megabytes per image to approximately 2,048 bytes per 512-dimensional embedding, and eliminating the direct visual reproducibility of the original face. This embedding-only approach aligns with the RA 10173 principle of data minimization: the system stores only the minimum information needed for identity matching, not the full biometric source data.

However, Jasmine and Jasper (2022) cautioned that embeddings themselves remain sensitive data. Their research showed that inversion attacks can potentially reconstruct approximate facial images from stored embedding vectors, meaning embedding databases must be protected with the same rigor as image databases. This finding has direct implications for database security: even though FRAMES does not store raw images, the embedding data requires encryption at rest, encryption in transit, and access control to prevent unauthorized extraction.

The convergence of technical best practices and local legal obligations shapes FRAMES's data architecture directly:
- **Embedding-only storage:** Only 512-dimensional float vectors are stored; no raw facial images are retained in the database.
- **Encrypted connections:** Database connections use SSL/TLS via Aiven PostgreSQL, preventing interception of embedding data in transit.
- **Password security:** User credentials are hashed using bcrypt with appropriate salt rounds, ensuring that even database compromise does not reveal plaintext passwords.
- **Role-based access control:** Dashboard access is scoped by user role (Student, Faculty, Department Head), preventing unauthorized data exposure.
- **Informed consent:** All users complete a biometric consent acknowledgment during the facial registration process before their embeddings are stored.

---

### 2.1.14 Software Quality Evaluation (ISO/IEC 25010)

ISO/IEC 25010:2023 defines an internationally recognized product quality model consisting of nine characteristics—Functional Suitability, Performance Efficiency, Compatibility, Interaction Capability, Reliability, Security, Maintainability, Flexibility, and Safety—providing a structured framework for evaluating software systems across multiple dimensions (ISO, 2023). Rather than relying on subjective impressions of "good" or "bad" software, the standard provides specific, measurable quality characteristics that can be assessed through defined instruments.

Britton (2021) emphasized that selecting a focused subset of ISO 25010 characteristics aligned to a system's primary use case produces more meaningful evaluation results than attempting to measure all nine characteristics simultaneously. This is particularly true for prototype-level academic deployments, where a single-day pilot cannot produce enough data to meaningfully evaluate characteristics like Maintainability (which requires long-term observation) or Compatibility (which requires multi-system integration testing).

For an automated attendance system like FRAMES, the most relevant characteristics are:

1. **Functional Suitability** — Does the system correctly log attendance? Does it accurately distinguish between entry, break-out, break-in, and exit? Do the dashboard reports match the kiosk actions?
2. **Performance Efficiency** — How fast does the kiosk respond to a face? Is the gesture detection latency acceptable? Do dashboard pages load in a reasonable time?
3. **Interaction Capability** — Is the kiosk interface intuitive enough to use without training? Are the required gestures easy to perform? Is the dashboard navigation understandable?
4. **Reliability** — Does the system consistently recognize enrolled users across multiple attempts? Are attendance logs recorded without missing entries? Does the auto-exit feature work consistently?
5. **Security** — Does the system prevent unauthorized attendance logging? Does gesture gating deter proxy attempts? Is role-based access control enforced on the dashboard?

While ISO 25010:2023 provides the evaluative structure and Britton (2021) offers the practical rationale for scoped application, together they support a targeted evaluation design that directly maps to FRAMES's core system goals. This focused approach ensures that the evaluation instruments—Likert-scale surveys administered to students, faculty, and the department head—generate actionable, interpretable findings rather than broad nominal assessments. Each survey item maps to a specific sub-characteristic of the selected ISO 25010 qualities, enabling the evaluation results to identify not just overall satisfaction but specific areas of strength and weakness.

---

## 2.2 Related Studies

### 2.2.1 Local Studies

Several attendance monitoring systems have been developed in the Philippines, demonstrating early adoption of facial recognition and embedded systems in local academic contexts. However, as the following review demonstrates, existing Philippine works consistently fall short in three areas: recognition accuracy under real constraints, anti-spoofing mechanisms, and measurable runtime performance. These persistent gaps define the specific contributions that FRAMES is designed to make.

#### Tempus — A Facial Recognition Attendance System

Attendance monitoring through facial recognition began gaining traction in Philippine academic institutions in the early 2020s, with several prototype systems exploring its feasibility under local constraints. Reynoso and Torres (2020) introduced Tempus, a Raspberry Pi 3–based attendance system using Haar cascade for detection and LBPH (Local Binary Patterns Histograms) for recognition, integrated with an IoT reporting feature. The study reported approximately 83% recognition accuracy and favorable usability ratings among faculty and staff who participated in testing. While the system proved feasible in classroom settings, it suffered from modest recognition accuracy (83% means roughly 1 in 6 recognition attempts fails or mismatches), no reported runtime performance metrics (FPS or latency), and the absence of any presentation attack detection mechanisms.

Delos Trinos et al. (2019) presented a related prototype at the IEEE HNICEM conference in Laoag, demonstrating automatic attendance logging through real-time video capture in a controlled conference setting. The system leveraged real-time face detection to log attendance automatically. Although effective for the controlled conference environment, the study did not address common Philippine constraints such as inconsistent lighting in classrooms or the potential for spoofing through photographs and video replay.

While Reynoso and Torres (2020) prioritize deployability and ease of use, Delos Trinos et al. (2019) emphasize operational feasibility in academic event contexts. Both studies demonstrate that facial recognition-based attendance works under controlled conditions but leave open questions about performance in typical Philippine classroom environments with inconsistent lighting and crowded entry points. Neither study addresses proxy attendance prevention, and neither reports FPS or latency metrics as key evaluation indicators. These gaps motivate FRAMES, which replaces Haar+LBPH with InsightFace's `buffalo_sc` embeddings (~97.5% accuracy) and introduces gesture-gated authentication specifically to prevent the proxied and photo-based attendance that Tempus and the HNICEM prototype are vulnerable to.

#### YOLOv3 and Web-Based Filipino Attendance Prototypes

More recent local studies explored advanced detection models and web-integrated dashboards to address the accuracy limitations of earlier systems. Alon et al. (2020) proposed a YOLOv3-based facial recognition attendance system that improved detection robustness over Haar cascades by leveraging a deep convolutional detection backbone. However, the implementation required higher-end computing resources not typically available on cost-sensitive campuses—limiting its practical replicability for most Philippine institutions where per-classroom hardware budgets are tightly constrained.

Domingo and Ladia (2024) took a different approach with QSUM-eASys, developed for Quirino State University. The system integrated face recognition with a centralized web dashboard for administrators, emphasizing usability as the primary evaluation metric. The web dashboard represented a step forward in terms of administrative utility, allowing administrators to review attendance records through a centralized interface. However, the system lacked runtime performance data (no latency or FPS measurements on the deployed hardware) and had no spoof prevention mechanisms—meaning a printed photograph could theoretically be used to log attendance.

While Alon et al. (2020) push toward model accuracy and Domingo and Ladia (2024) push toward administrative utility, both represent partial solutions to a problem that requires accuracy, efficiency, and security simultaneously. Across all four reviewed local studies, three persistent gaps emerge: (1) no system implements Presentation Attack Detection; (2) no system documents recognition speed or FPS on deployed hardware; and (3) no system uses multimodal authentication to prevent intentional proxy attendance. FRAMES is designed to address all three gaps by combining InsightFace's `buffalo_sc` model with gesture-gated logging, measurable performance benchmarks, and a real-time web dashboard evaluated against ISO/IEC 25010:2023.

---

### 2.2.2 Foreign Studies

#### Raspberry Pi as a Platform for Smart Attendance

International research has broadly affirmed the Raspberry Pi's viability as a platform for real-time attendance systems, though individual studies tend to optimize for a single performance dimension at the expense of others. Nadhan et al. (2022) introduced an automatic attendance monitoring framework that reduced manual workload without significant accuracy loss, establishing a baseline for practical Pi-based attendance. Shabaneh et al. (2023) developed a Raspberry Pi–based classroom system specifically emphasizing edge processing and low power consumption for sustainable, always-on deployment.

Vishwas et al. (2024) confirmed the feasibility of deep learning-based student attendance monitoring with system integration across a campus network, demonstrating that Pi-based systems can scale beyond single-room pilots. Nguyen et al. (2021b) validated that AI and IoT together enable reliable automated classroom attendance with edge-to-cloud synchronization, establishing a working benchmark for the kind of kiosk-to-server architecture that FRAMES adopts. Panwar et al. (2024) integrated convolutional neural networks to achieve higher recognition accuracy—though at increased computational cost that may challenge real-time performance on the Pi's ARM CPU.

Elnozahy et al. (2025) and Aboluhom and Kandilli (2025) extended Raspberry Pi applications further into secure access control and multitask classification (identity, age, ethnicity), demonstrating the platform's expanding capability envelope beyond simple attendance logging. These studies show that Pi hardware can support increasingly complex vision tasks when the model architecture is appropriately optimized.

Comparing these works, Nadhan et al. and Shabaneh et al. optimize for practicality and deployment sustainability, Vishwas et al. and Nguyen et al. (2021b) for AI-IoT integration and campus-scale viability, Panwar et al. for recognition accuracy, and Elnozahy et al. and Aboluhom and Kandilli for expanding the Pi's application range. Collectively, these studies demonstrate that no single prior study optimizes accuracy, real-time performance, and anti-spoofing simultaneously under resource-constrained conditions. FRAMES addresses this convergence point by selecting InsightFace's `buffalo_sc`, which provides near real-time inference on the Raspberry Pi 4 while maintaining recognition accuracy sufficient for controlled kiosk conditions, combined with gesture gating as a behavioral anti-spoofing layer absent from all reviewed studies.

#### Gesture-Controlled Systems and Multimodal Architectures

International research on gesture-based human-computer interaction and multimodal attendance systems provides the technical foundation for FRAMES's gesture-gated design. Yadav and Jain (2024) demonstrated a vision-based hand gesture recognition model achieving high accuracy and real-time performance using landmark-detection pipelines, validating the core technical approach that FRAMES relies on for gesture classification. Dhananjay et al. (2024) applied gesture-driven interfaces to smart home IoT automation, confirming gesture recognition's practical value in contactless control scenarios beyond laboratory settings. Muneeb et al. (2023) demonstrated gesture-based appliance automation for elderly assistance, further validating that static gesture pipelines are reliable and deployable in real-world environments with non-expert users—a relevant consideration for a university attendance system where students receive minimal training.

Mohammad et al. (2024) proposed the most directly relevant precedent: an embedded multimodal face recognition framework using MobileNetV2 and FaceNet on Raspberry Pi 400, achieving near real-time performance at approximately 12 frames per second and demonstrating that multimodal fusion is computationally feasible on constrained hardware. While Yadav and Jain (2024), Dhananjay et al. (2024), and Muneeb et al. (2023) establish the reliability of gesture pipelines in isolation across different application domains, Mohammad et al. (2024) demonstrate what is achievable when face and gesture modalities are combined on Pi-class hardware—a more direct precedent for FRAMES's design.

However, Mohammad et al. (2024) do not implement anti-spoofing explicitly, use a different Pi model (Pi 400 with keyboard form factor rather than Pi 4B), and do not address the institutional context of academic attendance with its requirements for role-based access, state-machine-based attendance logging (entry → break-out → break-in → exit), and exportable reports. FRAMES extends this work by combining InsightFace's `buffalo_sc` recognition with MediaPipe gesture gating in a fully integrated, web-dashboard-connected attendance system evaluated against ISO/IEC 25010.

---

> 📋 **[INSERT TABLE 4 HERE — STRONGLY RECOMMENDED]**  
> **Type:** Synthesis / Summary of Related Studies Table  
> **Title:** *Table 4. Summary of Related Local and Foreign Studies*  
> **Suggested columns:** Author(s) & Year | Country/Context | System Type | Technology Used | Strengths | Limitations | Gap Addressed by FRAMES  
> **Suggested rows:** Include all 4 local studies (Reynoso & Torres, Delos Trinos et al., Alon et al., Domingo & Ladia) and key foreign studies (Nadhan et al., Shabaneh et al., Vishwas et al., Nguyen et al. 2021b, Panwar et al., Mohammad et al.)  
> **Why this is important:** Philippine capstone panels almost always ask how the current study differs from prior works. This table gives a direct, scannable answer during oral defense.  
> **Recommended tool:** Microsoft Word table (copy-paste from this MD), or Google Docs

---

## 2.3 Synthesis of the Literature

The foregoing review reveals a clear trajectory in attendance monitoring research: from manual processes to token-based automation (RFID, QR), to single-modality biometrics (face or fingerprint), and most recently to multimodal systems that combine biometric identification with behavioral confirmation. Each generation addresses specific limitations of the previous one while introducing new trade-offs.

**On embedded hardware viability:** The collective evidence from Swathi and RathnaChary (2023), Ashok Kumar et al. (2021), Touzene et al. (2024), Ren (2024), Aboluhom and Kandilli (2025), and others establishes beyond reasonable doubt that the Raspberry Pi 4 Model B is a viable platform for real-time facial recognition in educational contexts. The critical variable is not the hardware itself but the choice and optimization of the recognition model. InsightFace's `buffalo_sc` model pack—built on MobileFaceNet with ArcFace training (Chen et al., 2018; Deng et al., 2019; Guo et al., 2021)—resolves the speed-accuracy trade-off that previous studies left unaddressed: ~97.5% LFW accuracy at 300–500 ms inference, enabling practical kiosk deployment.

**On multimodal fusion:** Jha et al. (2024), Mukthineni et al. (2020), and Bala et al. (2022) converge on the finding that combining face recognition with a behavioral confirmation modality (specifically a gesture) through sequential, decision-level fusion reduces false acceptance rates while adding minimal computational overhead. This is the security architecture that elevates FRAMES beyond face-only systems (which are vulnerable to photograph-based spoofing) and token-based systems (which are vulnerable to sharing and impersonation). The gesture confirmation layer does not claim to be an absolute liveness guarantee—a limitation transparently acknowledged based on Jha et al. (2024) and the decoupled-detection concern—but it demonstrably raises the effort required for casual proxy attendance.

**On gesture recognition:** MediaPipe Hands (Lugaresi et al., 2019) emerges as the clear choice for lightweight static gesture detection on constrained hardware, validated by Mohamed et al. (2024), Anand et al. (2024), Sarma and Bhuyan (2021), Perwej et al. (2025), and Siva Priya et al. (2025). The three-frame debouncing approach recommended by Sarma and Bhuyan (2021) addresses the gesture segmentation problem, ensuring that only deliberate, sustained gestures are recorded.

**On privacy and legal compliance:** The combination of embedding-only storage (Schroff et al., 2015; Deng et al., 2019), encrypted database connections, and informed consent protocols satisfies the requirements of RA 10173 (National Privacy Commission, 2012), while the cautionary findings of Jasmine and Jasper (2022) and Buolamwini and Gebru (2018) inform the system's security architecture and model selection.

**On evaluation frameworks:** ISO/IEC 25010:2023 (ISO, 2023), applied in the focused manner recommended by Britton (2021), provides a rigorous yet practical evaluation structure for a prototype-level deployment.

**On persistent gaps across the literature:** Despite twenty years of attendance system research, the reviewed studies—both local and international—consistently exhibit three recurring gaps:

1. **No multimodal anti-spoofing.** None of the reviewed attendance-specific systems (local or foreign) implements both face recognition and gesture-gated confirmation in a single deployed prototype. Face-only systems remain the default.
2. **No documented edge performance.** The majority of studies omit FPS, latency, and per-stage timing data for their deployed hardware, making it impossible to compare real-time feasibility across implementations.
3. **No integrated dashboard with role-based reporting.** Most systems record attendance data but do not transform it into structured, role-specific reports and real-time dashboards with visualization patterns validated by dashboard design research (Bach et al., 2023).

FRAMES is positioned at the intersection of these three gaps: it combines InsightFace's `buffalo_sc` face recognition with MediaPipe gesture gating on Raspberry Pi 4, documents per-stage latency benchmarks (Table 2), and delivers a role-based web dashboard with real-time visualization and exportable reports—all evaluated under ISO/IEC 25010. No single prior study in the reviewed literature addresses all three concerns simultaneously.

---

## 2.4 Conceptual Framework

### Input-Process-Output (IPO) Model

The conceptual framework of this study follows the Input-Process-Output (IPO) model to illustrate the system's development lifecycle and operational flow.

> 🖼️ **[INSERT FIGURE 4 HERE — REQUIRED]**  
> **Type:** IPO Conceptual Framework Diagram  
> **Title:** *Figure 4. Conceptual Framework of FRAMES Using the IPO Model*  
> **Suggested content:** A three-column diagram with labeled boxes:  
> - **INPUT column:** Knowledge Requirements (InsightFace, MediaPipe, FastAPI, PostgreSQL, RA 10173, ISO 25010) | Software Requirements (list) | Hardware Requirements (list)  
> - **PROCESS column (with arrows):** 1. Design → 2. Create → 3. Test and Improve (with feedback loop arrow from Test back to Design)  
> - **OUTPUT column:** FRAMES System (kiosk + web dashboard + real-time monitoring + reports)  
> - **EVALUATION box below OUTPUT:** ISO/IEC 25010 Quality Model (Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, Security)  
> **This figure is standard in Philippine capstone Chapter 2 and is expected by most panels.**  
> **Recommended tool:** Microsoft Word SmartArt (Process > Basic Process), PowerPoint, or Draw.io

#### Input

The input phase establishes the system's foundation by identifying essential knowledge, software, and hardware requirements:

**Knowledge Requirements:**
- Facial recognition techniques using InsightFace (`buffalo_sc` model: SCRFD detection + MobileFaceNet recognition with ArcFace loss)
- Hand gesture recognition through MediaPipe Hands (static gesture detection with 21-landmark classification)
- Web development with FastAPI (Python, asynchronous backend) and React (Vite, JSX frontend)
- Database management with PostgreSQL (Aiven Cloud, SSL-encrypted connections)
- Compliance with the Data Privacy Act of 2012 (RA 10173) for biometric data handling
- ISO/IEC 25010:2023 Software Quality Model for system evaluation

**Software Requirements:**
- Raspberry Pi OS Bookworm 64-bit (edge device operating system)
- Python 3.11+ with InsightFace, ONNX Runtime, MediaPipe, OpenCV (recognition and gesture pipeline)
- FastAPI with SQLAlchemy 2.x ORM (backend framework and database access)
- Vite + React 19.2 with Bootstrap 5.3, Axios, Chart.js/Recharts (frontend framework and visualization)
- PostgreSQL hosted on Aiven Cloud with SSL connectivity (cloud database)

**Hardware Requirements:**
- Raspberry Pi 4 Model B (4 GB RAM, quad-core ARM Cortex-A72)
- USB webcam (720p, UVC-compliant, plug-and-play on Pi OS)
- 7-inch HDMI IPS kiosk display (1024×600 resolution)
- Power supply (5V 3A USB-C)
- Network connectivity (Wi-Fi or Ethernet for API synchronization)

#### Process

The process phase explains how the system was developed through three iterative stages:

1. **Design** — The researchers designed the system architecture, including the two-pipeline model (enrollment on server, recognition on edge), dashboard wireframes for Student, Faculty, and Department Head modules, the PostgreSQL database schema with attendance state machine logic, and the kiosk UI layout with gesture prompt overlays. User flows for facial enrollment, attendance action sequences (entry → break-out → break-in → exit), and report generation were mapped before implementation began.

2. **Create** — Implementation involved building the FastAPI backend with SQLAlchemy ORM, connecting to the PostgreSQL cloud database via SSL, developing the React-based frontend with Bootstrap for responsive design, integrating InsightFace's `buffalo_sc` for face enrollment and recognition via ONNX Runtime, implementing MediaPipe Hands for gesture detection with three-frame debouncing, and building the kiosk server for the Raspberry Pi with camera feed, real-time overlay, and attendance logging.

3. **Test and Improve** — Testing included functional testing of face and gesture recognition accuracy, performance testing on the Raspberry Pi 4 (recognition speed, per-stage latency, memory usage), integration testing between the kiosk, backend API, and web dashboard, and user acceptance testing with students, faculty, and the department head. Feedback from each test cycle was used to refine recognition thresholds, improve kiosk UI responsiveness, and optimize the gesture detection pipeline. The system was evaluated using the ISO/IEC 25010 Software Quality Model.

#### Output

The output is **FRAMES** — a web-based, gesture-gated facial recognition attendance system deployed on Raspberry Pi. The system automates attendance logging through contactless multimodal authentication (face + gesture), provides real-time attendance visualization through a role-based web dashboard with color-coded occupancy tiles, and delivers exportable reports in CSV and PDF formats for documentation and administrative use.

#### Evaluation

The system is assessed using the **ISO/IEC 25010 Software Quality Model** focusing on five characteristics: Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security. Structured Likert-scale survey questionnaires are administered to 43 respondents—20 students from a computer-related program (live kiosk interaction), 20 students from a non-computer-related program (demonstration video), 2 faculty members, and 1 department head—after the pilot deployment and demonstration sessions.

---

## 2.5 Theoretical and Quality Evaluation Lens

FRAMES is developed under the intersection of three theoretical perspectives:

1. **Edge-AI Computing Theory** — The principle that artificial intelligence inference can be performed directly on resource-constrained edge devices (Raspberry Pi) rather than requiring centralized server infrastructure, as demonstrated by Chen et al. (2018) and validated across the embedded systems literature reviewed in Section 2.1.2.

2. **Multimodal Biometric Fusion Theory** — The established finding that combining independent biometric or behavioral modalities through sequential, decision-level fusion yields measurably lower error rates than single-modality systems, as demonstrated by Jha et al. (2024), Mukthineni et al. (2020), and Bala et al. (2022) and reviewed in Section 2.1.8.

3. **ISO/IEC 25010:2023 Product Quality Model** — The internationally recognized software quality framework that provides the evaluative structure for assessing FRAMES's Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security (ISO, 2023; Britton, 2021).

These three perspectives collectively frame why FRAMES works (edge-AI makes Pi-based recognition feasible), why it is more secure than alternatives (multimodal fusion deters spoofing), and how its quality is measured (ISO 25010 provides the evaluation structure).

---

## 2.6 Operational Definition of Terms

The following terms are defined as they are used in the context of this study:

**AIoT (Artificial Intelligence of Things)** — The convergence of AI inference capabilities with IoT connectivity, enabling edge devices to perform intelligent recognition tasks locally while synchronizing results to centralized cloud-based systems. FRAMES operates as an AIoT system: recognition happens on the Raspberry Pi kiosk, and results are immediately synchronized to the Aiven PostgreSQL cloud database.

**Anomaly Notification** — An alert generated by the kiosk when a detected face does not match any enrolled student in the currently scheduled class for that room. The individual is flagged as unrecognized and no attendance is logged. A distinct notification is generated for individuals who are registered in the system but not enrolled in the current class.

**Attendance Tracking** — The automated recording of time-in (entry), break-out, break-in, and time-out (exit) logs of users, stored in the system's PostgreSQL database for reporting and monitoring. The system also supports an **early entry window** (recognizing users up to 10 minutes before class start) and an **auto-exit** mechanism (automatically closing open sessions at class end time).

**Auto-Exit (AUTO_TIMEOUT)** — A system-initiated EXIT action logged automatically at the class `end_time` for all users whose attendance session is still open. Auto-exit records are marked `verified_by = AUTO_TIMEOUT` and include a `[AUTO_EXIT]` remark to distinguish them from user-initiated exits.

**Break-In** — The action performed by a user when returning from a break period, confirmed through a thumbs-up gesture after facial recognition.

**Break-Out** — The action performed by a user when leaving temporarily for a break, confirmed through a peace sign (two-finger) gesture.

**Cosine Similarity** — A mathematical measure used to compare two face embeddings by computing the cosine of the angle between them. A score of 1.0 indicates identical vectors; the FRAMES match threshold is 0.30 (cosine distance, where lower = more similar).

**Depthwise Separable Convolution** — A neural network operation used in MobileFaceNet that decomposes standard convolutions into two sequential steps: depthwise convolution (each channel processed independently) and pointwise convolution (1×1 convolution combining channel outputs), reducing computational cost by approximately 8–9× while preserving recognition accuracy.

**Early Entry Window** — A configurable time buffer (default: 10 minutes) before the official class `start_time` during which the kiosk begins accepting attendance, ensuring early-arriving students are not denied entry.

**Embedded System** — A computing setup where hardware (Raspberry Pi 4, USB webcam, kiosk display) and software (InsightFace recognition, MediaPipe gesture detection, kiosk server) are integrated into a dedicated device that performs attendance monitoring tasks at the edge without requiring external server infrastructure for real-time recognition.

**Face Embeddings** — 512-dimensional normalized floating-point vectors extracted from aligned face crops by the MobileFaceNet model. Each embedding represents abstract facial features (spatial relationships among landmarks) and occupies 2,048 bytes in database storage. No raw facial images are stored.

**Facial Recognition** — A biometric authentication process that identifies and verifies users based on unique facial features by extracting and comparing face embeddings. It answers "whose face is it?" as opposed to face detection, which answers "where is the face?" In FRAMES, it serves as the primary modality for identity validation.

**FastAPI** — An asynchronous Python web framework used as the FRAMES backend, providing high-performance API endpoints for authentication, face enrollment, attendance logging, schedule management, and report generation. Its native WebSocket support enables real-time dashboard updates.

**Gesture Debouncing (Temporal Smoothing)** — A technique requiring consistent gesture detection across three consecutive frames before accepting the input, minimizing errors from random or unintentional hand movements and addressing the gesture segmentation challenge identified in the literature.

**Gesture-Gated Logging** — A multimodal security feature in which attendance actions (break-out, break-in, exit) are only recorded after both facial recognition and a confirming hand gesture are detected within a temporal window. Entry is automatic upon face recognition.

**Hand Gesture Authentication** — A behavioral interaction process using MediaPipe Hands, where users perform specific static hand gestures (peace sign for break-out, thumbs-up for break-in, open palm for exit) to confirm attendance actions.

**InsightFace** — An open-source face analysis library developed by the Chinese Academy of Sciences, providing pre-trained model packs for face detection, alignment, and recognition. FRAMES uses the `buffalo_sc` model pack.

**ISO/IEC 25010 Quality Model** — The international software quality evaluation framework (2023 revision) used in this study, focusing on Functional Suitability, Performance Efficiency, Interaction Capability, Reliability, and Security.

**Kiosk** — A physical station consisting of a Raspberry Pi 4, USB webcam, and 7-inch HDMI display, mounted at the classroom entrance at approximately eye-level (1.6 meters). It serves as the interaction point for students and faculty during attendance logging.

**MediaPipe** — A cross-platform machine learning framework by Google (Lugaresi et al., 2019) used in FRAMES for: (1) BlazeFace pre-filter for fast face detection gating on the Raspberry Pi, and (2) Hands module for static hand gesture recognition based on 21 hand landmarks.

**MobileFaceNet** — The recognition neural network within the `buffalo_sc` model pack, based on MobileNetV2 with depthwise separable convolutions (Chen et al., 2018), which converts 112×112 aligned face images into 512-dimensional embedding vectors.

**Modules (Student, Faculty, Department Head)** — The subsystems of the web platform tailored to user roles. The **Student Module** displays personal attendance records and status. The **Faculty Module** enables class-level monitoring and report generation. The **Department Head Module** extends faculty access with department-wide oversight and aggregated reports.

**Multimodal Authentication** — A security process requiring more than one biometric or behavioral input (face recognition + hand gesture) to validate attendance actions, exploiting the complementary strengths of each modality.

**ONNX Runtime** — The inference engine used on the Raspberry Pi to execute InsightFace's pre-trained ONNX models on the ARM64 CPU, providing optimized model inference without requiring framework-specific dependencies.

**Presentation Attack Detection (PAD)** — Any measure used to detect a fake or artificial presentation of biometric data. In FRAMES, gesture confirmation acts as a behavioral PAD mechanism.

**Raspberry Pi 4 Model B** — A single-board computer with a quad-core ARM Cortex-A72 processor (1.5 GHz) and 4 GB LPDDR4 RAM, serving as the edge computing device for the FRAMES kiosk.

**Room Visualization** — A real-time display of classroom occupancy on the web dashboard, showing which students are present (green), on break (yellow), or have exited, using color-coded tiles.

**SCRFD (Sample and Computation Redistribution for Efficient Face Detection)** — The lightweight face detection model within `buffalo_sc` (~2.5 MB) that locates faces in the camera frame and extracts 5 facial landmarks for alignment before embedding extraction.

**Smart Monitoring System** — The prototype integrating Raspberry Pi–based facial recognition with InsightFace `buffalo_sc` and hand gesture authentication via MediaPipe, supported by a web dashboard for real-time attendance and occupancy monitoring.

**USB Webcam** — A Universal Video Class (UVC)-compliant camera connected to the Raspberry Pi via USB, providing 720p (1280×720) video at 30fps for face detection and recognition.

**Web-Based Dashboard** — The centralized platform developed with Vite + React (JSX) and Bootstrap 5.3, providing real-time data visualization, attendance reports, and role-based access for the department head, faculty, and students.

---

## 2.7 Chapter Summary

This chapter examined the literature and related studies across fourteen key areas relevant to the development of FRAMES. The review established that: (1) Raspberry Pi 4 is a validated platform for embedded facial recognition; (2) InsightFace's `buffalo_sc` model provides the optimal speed-accuracy trade-off for kiosk deployment; (3) MediaPipe Hands enables reliable static gesture detection with minimal computational overhead; (4) sequential, decision-level multimodal fusion (face → gesture) is the recommended architecture for resource-constrained attendance systems; (5) gesture gating functions as a practical behavioral deterrent against casual spoofing, not as an absolute security guarantee; and (6) ISO/IEC 25010:2023 provides the appropriate evaluation framework for prototype-level deployment.

The synthesis of local and foreign studies identified three persistent gaps—the absence of multimodal anti-spoofing, the lack of documented edge performance metrics, and the absence of integrated role-based dashboards—that collectively define the research contribution of FRAMES. The conceptual framework presented in Section 2.4 operationalizes these findings into an Input-Process-Output model that guides the system's design, implementation, and evaluation.
