# FRAMES — Raspberry Pi Kiosk Setup & Recognition Pipeline

## What Is This?

This is the **face recognition kiosk** that runs on a Raspberry Pi in the classroom. When a student or faculty member stands in front of the kiosk camera, it recognizes them and logs their attendance.

---

## Terminology: "Laptop" vs "Kiosk"

These two terms come up a lot. Here's what they mean:

| Term | What It Actually Is | Used For |
|------|-------------------|----------|
| **"Laptop"** | Your personal Windows laptop (any brand — Dell, Lenovo, Acer, etc.) | Development, coding, testing, running the backend server, face enrollment via webcam |
| **"Kiosk"** | Raspberry Pi 4 + Camera V2 + 7" HDMI display (assembled together) | Classroom face recognition + gesture detection + attendance logging |

The 7" HDMI display is **NOT** a laptop. It's just a small screen plugged into the Raspberry Pi so students can see the camera feed and confirmations. Think of it as a mini monitor.

```
YOUR LAPTOP (development)              KIOSK (classroom)
┌──────────────────────┐               ┌──────────────────────┐
│  Windows PC          │               │  Raspberry Pi 4      │
│  - Write code        │               │  + Camera V2 (8MP)   │
│  - Run backend       │   Internet    │  + 7" HDMI display   │
│  - Enroll faces      │◄────────────►│  + USB touch          │
│  - Test with webcam  │               │                      │
│  - View dashboard    │               │  → Recognizes faces  │
│                      │               │  → Detects gestures  │
│  Has: VS Code,       │               │  → Logs attendance   │
│  Python, browser     │               │  → Sends to backend  │
└──────────────────────┘               └──────────────────────┘
```

---

## Your Hardware Checklist

Before starting, make sure you have ALL of these:

| Item | You Have It? | Notes |
|------|:---:|-------|
| Raspberry Pi 4 Model B (4GB or 8GB RAM) | ? | The main computer for the kiosk |
| MicroSD card (32GB or more) | ? | This is the Pi's "hard drive" |
| USB-C power supply (5V / 3A minimum) | ? | Powers the Pi — must be 3A, not a phone charger |
| RPi Camera V2 (8MP, Sony IMX219) | ✅ | The camera board that connects via flex cable |
| Flex cable 150mm (for camera) | ✅ | Connects camera board to Pi's CSI port |
| 7" HDMI display (1024x600, USB touch) | ✅ | The screen — plugs in via HDMI + USB |
| HDMI cable (micro-HDMI to full HDMI, or adapter) | ? | RPi4 uses **micro-HDMI**, your display likely uses full HDMI |
| Keyboard + mouse (temporary, for initial setup) | ? | Only needed for first-time setup, can remove later |
| WiFi network (or ethernet cable) | ? | Pi needs internet to talk to your backend |
| MicroSD card reader (for your laptop) | ? | To flash the OS onto the SD card from your laptop |

> **IMPORTANT:** The RPi4 has **micro-HDMI** ports (small), NOT full-size HDMI. You likely need a **micro-HDMI to HDMI adapter/cable**. Check what connector your 7" display has and buy the right cable if needed.

---

## PHASE 1: Flash Raspberry Pi OS (Do This on Your Laptop)

You need to install an operating system onto the microSD card. This is like installing Windows, but for the Pi.

### Step 1.1 — Download Raspberry Pi Imager

1. On **your laptop**, open a browser
2. Go to: **https://www.raspberrypi.com/software/**
3. Click **"Download for Windows"**
4. Install it (just click Next, Next, Install)

### Step 1.2 — Insert the MicroSD Card

1. Put the microSD card into the card reader
2. Plug the card reader into your laptop
3. Windows should detect it as a new drive (e.g., drive D: or E:)

### Step 1.3 — Flash the OS

1. Open **Raspberry Pi Imager**
2. Click **"Choose Device"** → select **Raspberry Pi 4**
3. Click **"Choose OS"** → select **Raspberry Pi OS (64-bit)**
   - **YOU MUST CHOOSE 64-BIT.** The code auto-detects `aarch64` (64-bit ARM) to enable RPi optimizations. If you install 32-bit, it will run but slower.
4. Click **"Choose Storage"** → select your microSD card
5. **BEFORE clicking "Next"**, click the **gear icon (⚙️)** or it may say **"Edit Settings"**. This is very important — it lets you pre-configure WiFi and SSH so you don't need to connect a monitor for basic setup:

   **General tab:**
   - ✅ Set hostname: `raspberrypi` (or any name you like)
   - ✅ Set username and password:
     - Username: `emma` (or any name — your Pi currently uses `emma`)
     - Password: (choose something you'll remember)
   - ✅ Configure wireless LAN:
     - SSID: (your WiFi network name — exactly as it appears)
     - Password: (your WiFi password)
     - Country: `PH` (Philippines) or your country
   - ✅ Set locale settings:
     - Time zone: `Asia/Manila` (or your timezone)
     - Keyboard layout: `us`

   **Services tab:**
   - ✅ Enable SSH → Use password authentication

6. Click **Save**, then click **Next**
7. It will ask "Would you like to apply customisation settings?" → Click **Yes**
8. It will warn about erasing the SD card → Click **Yes**
9. **Wait for it to finish** (takes 5-10 minutes depending on your SD card speed)
10. When done, it says "Write Successful" → click **Continue**
11. **Safely eject** the SD card from your laptop

---

## PHASE 2: Assemble the Hardware

### Step 2.1 — Connect the Camera V2 to the Raspberry Pi

The camera connects via a **flat flex cable** to the **CSI port** on the Pi.

```
RASPBERRY PI 4 — TOP VIEW (ports facing you)

          USB-C    micro-HDMI  micro-HDMI   Audio
          (power)  (HDMI 0)    (HDMI 1)     (3.5mm)
    ┌──────┴──────────┴──────────┴────────────┴───────┐
    │                                                   │
    │                                                   │
    │  ┌──────────────────────┐                         │
    │  │    CSI CAMERA PORT   │  ← THIS IS WHERE THE   │
    │  │   (between HDMI &    │    CAMERA CABLE GOES    │
    │  │    ethernet port)    │                         │
    │  └──────────────────────┘                         │
    │                                                   │
    │    GPIO pins (40 pins)                            │
    │                                                   │
    │                                  ┌──────┐         │
    │                                  │ ETH  │ Ethernet│
    │  USB 2.0  USB 2.0  USB 3.0  USB │ port │         │
    └──┴────────┴────────┴────────┴────┴──────┴─────────┘
```

**How to connect:**

1. **Find the CSI camera port** on the Pi — it's a thin rectangular slot with a plastic clip, located between the HDMI ports and the Ethernet port
2. **Gently pull UP the plastic clip** with your fingernails (it lifts about 2mm, don't force it)
3. **Insert the flex cable:**
   - The cable has a **blue backing on one side** and **silver/gold contacts on the other**
   - **Blue side faces the Ethernet port** (away from HDMI ports)
   - **Silver contacts face the HDMI ports**
   - Slide the cable straight into the slot (it goes in about 2-3mm)
4. **Push the plastic clip back DOWN** to lock the cable in place
5. Gently tug the cable to make sure it's secure (it shouldn't slide out)

> **WARNING:** If you put the cable in backwards (blue side facing wrong direction), the camera will not be detected. If the camera doesn't work later, come back here and flip the cable.

### Step 2.2 — Connect the 7" HDMI Display

Your display needs TWO cables to the Pi:

1. **HDMI cable** → for the video signal (what to show on screen)
   - Plug into **HDMI 0** on the Pi (the HDMI port **closest to the USB-C power port**)
   - Plug the other end into the display's HDMI port
   - If the Pi has micro-HDMI and the display has full HDMI, you need an adapter

2. **USB cable** → for touch input AND to power the display
   - Plug the USB cable from the display into **any USB port** on the Pi
   - This does two things: powers the display's backlight AND enables touch input

```
CONNECTIONS:

RPi4 [micro-HDMI 0] ──── HDMI cable ────► [HDMI] Display (video)
RPi4 [USB port]      ──── USB cable  ────► [USB]  Display (touch + power)
```

### Step 2.3 — Insert MicroSD Card

1. Flip the Pi over (bottom side)
2. You'll see the microSD card slot on the edge
3. Push the SD card in (contacts facing up toward the board) until it clicks

### Step 2.4 — Connect Keyboard and Mouse (Temporary)

Plug a USB keyboard and USB mouse into the Pi's remaining USB ports. You only need these for initial setup — once SSH is working, you can control the Pi from your laptop.

### Step 2.5 — Power On

1. Plug in the USB-C power supply to the Pi
2. The Pi will boot automatically — you'll see a rainbow screen, then the Raspberry Pi logo, then the desktop
3. **First boot takes 1-2 minutes** (it's expanding the filesystem and applying your settings)

---

## PHASE 3: First Boot Configuration

### Step 3.1 — Verify You're Booted

After 1-2 minutes, you should see the Raspberry Pi desktop on your 7" display. If you see it — congratulations, the OS and display are working.

**If the screen is black:**
- Try the other HDMI port (HDMI 1 instead of HDMI 0)
- Make sure the power supply is 5V/3A (a weak charger won't boot properly)
- Check if the green LED on the Pi is blinking (means it's trying to boot)

### Step 3.2 — Open a Terminal

Click the **black terminal icon** in the top taskbar. Or press **Ctrl + Alt + T**.

You should see a prompt like:
```
emma@raspberrypi:~ $
```

### Step 3.3 — Verify the Camera

Type this command and press Enter:
```bash
libcamera-still -o test_photo.jpg
```

**What should happen:**
- You'll see a preview window for ~5 seconds
- It takes a photo and saves it as `test_photo.jpg`
- If this works → camera is connected correctly

**If you get an error like "no cameras available":**
1. The cable might be in backwards — power off (`sudo shutdown now`), flip the cable, power on again
2. Or the cable isn't seated properly — power off, re-seat the cable, power on
3. Or open the config tool:
   ```bash
   sudo raspi-config
   ```
   Go to **Interface Options → Camera → Enable**, then reboot:
   ```bash
   sudo reboot
   ```

### Step 3.4 — Check Internet Connection

```bash
ping google.com -c 3
```

**What should happen:**
- You see 3 lines with response times (like `64 bytes from ...`)
- This means WiFi is working

**If it says "Network unreachable":**
1. Click the WiFi icon in the top-right of the desktop taskbar
2. Select your WiFi network and enter the password
3. Try `ping google.com -c 3` again

### Step 3.5 — Find Your Pi's IP Address

You'll need this later to transfer files from your laptop:
```bash
hostname -I
```

It will print something like `192.168.1.105`. **Write this down.**

### Step 3.6 — SSH Into Your Pi From Your Laptop

Once you have the Pi's IP address (Step 3.5) and SSH was enabled during SD card setup (Phase 1), you can control the Pi from your laptop terminal instead of using the 7" screen + keyboard.

**On your laptop** (PowerShell on Windows, Terminal on Mac/Linux):

```bash
ssh emma@<PI_IP_ADDRESS>
```

Replace `<PI_IP_ADDRESS>` with the IP from Step 3.5. For example:
```bash
ssh emma@10.244.181.134
```

**First-time connection:**
- It will ask: `Are you sure you want to continue connecting (yes/no)?` → Type `yes` and press Enter
- Enter the password you set during SD card setup (Phase 1)
- You should see the Pi's terminal prompt:
  ```
  emma@raspberrypi:~ $
  ```

**If connection is refused or times out:**
- Make sure your laptop and Pi are on the **same WiFi network**
- Verify the IP is correct: on the Pi's 7" screen, run `hostname -I` again
- If SSH wasn't enabled, run this on the Pi directly: `sudo raspi-config` → Interface Options → SSH → Enable, then reboot
- The Pi's IP can change if your router uses DHCP — re-check with `hostname -I` each time

**Tips for daily use:**
- You can have multiple SSH sessions open at once (useful: one for running code, one for monitoring)
- The keyboard/mouse plugged into the Pi are no longer needed once SSH is working
- To disconnect: type `exit` or press **Ctrl+D**
- To shut down the Pi remotely: `sudo shutdown now`

> **IMPORTANT for GUI programs (test_laptop.py, main_kiosk.py):**
> SSH sessions have no display, so `cv2.imshow()` will crash. You MUST prefix commands with `DISPLAY=:0` to route the GUI window to the Pi's 7" screen:
> ```bash
> DISPLAY=:0 python rpi/test_laptop.py
> ```
> See Phase 7 for more details.

### Step 3.7 — Update the System

This downloads the latest security patches and software updates (run this on the Pi, either directly or via SSH):
```bash
sudo apt update && sudo apt upgrade -y
```

**This takes 5-15 minutes.** Let it finish completely. Don't close the terminal.

---

## PHASE 4: Install Python and Dependencies on the Pi

### Step 4.1 — Install System-Level Packages

These are libraries that Python packages need to compile:
```bash
sudo apt install -y python3-pip python3-venv python3-opencv python3-picamera2 libatlas-base-dev libopenblas-dev libhdf5-dev libjpeg-dev libpng-dev
```

> **`python3-picamera2` is critical.** On Bookworm (2024+), the Pi Camera V2 uses the new `libcamera` stack. OpenCV's `cv2.VideoCapture(0)` **cannot** read from this camera — it opens but returns empty frames. `picamera2` is the official Python library that works with `libcamera`.

### Step 4.2 — Create a Project Folder and Virtual Environment

The `--system-site-packages` flag is **required** so that `picamera2` (installed system-wide via apt) is accessible inside the virtual environment:
```bash
mkdir -p ~/frames
cd ~/frames
python3 -m venv --system-site-packages venv
```

> **Why `--system-site-packages`?** `picamera2` has C-level dependencies on `libcamera` that can only be installed via `apt`, not `pip`. The `--system-site-packages` flag lets the venv see the system-installed `picamera2` package.

### Step 4.3 — Activate the Virtual Environment

```bash
source ~/frames/venv/bin/activate
```

Your prompt should change to show `(venv)` at the beginning:
```
(venv) emma@raspberrypi:~/frames $
```

> **IMPORTANT:** Every time you open a new terminal or SSH session, you need to run `source ~/frames/venv/bin/activate` again before running any Python commands. The `(venv)` prefix tells you it's active.

### Step 4.4 — Upgrade pip

```bash
pip install --upgrade pip setuptools wheel
```

### Step 4.5 — Install Python Packages

**IMPORTANT ORDER:** Some packages must come from the **system** (via apt), not pip. Installing the wrong version via pip causes ABI conflicts.

**DO NOT `pip install numpy` or `pip install opencv-python`.** Here's why:
- The system already has `numpy` (1.24.x) and `opencv` (with GTK GUI support) from apt.
- `pip install numpy` installs a newer version (2.x) that **breaks `picamera2`** — you get `ValueError: numpy.dtype size changed` from `simplejpeg`.
- `pip install opencv-python` installs a headless build that **cannot display windows** — `cv2.imshow()` crashes with "The function is not implemented. Rebuild with GTK+ 2.x".

Install **only these** via pip:
```bash
pip install numpy==1.26.4
```
> **Why 1.26.4 specifically?** It's new enough for `insightface`/`scipy` (which need `numpy.exceptions`, added in 1.25) but old enough to be ABI-compatible with the system's `simplejpeg` (which `picamera2` depends on). Do **NOT** install numpy 2.x.

Then:
```bash
pip install mediapipe
```
Then:
```bash
pip install requests
```
Then:
```bash
pip install onnxruntime
```

> **If `onnxruntime` fails** with an error about "no matching distribution":
> ```bash
> pip install onnxruntime --extra-index-url https://google-coral.github.io/py-repo/
> ```
> If that also fails, try:
> ```bash
> pip install onnxruntime-gpu
> ```
> As a last resort, Google "onnxruntime raspberry pi 4 arm64 wheel" and download a `.whl` file manually.

Then:
```bash
pip install insightface
```

**Packages that come from the system (already installed via apt in Step 4.1):**
| Package | Source | Why |
|---------|--------|-----|
| `numpy` (base) | apt (`python3-numpy`) | ABI-compatible with `simplejpeg`/`picamera2` |
| `opencv` | apt (`python3-opencv`) | Has GTK support — `cv2.imshow()` works |
| `picamera2` | apt (`python3-picamera2`) | C-level `libcamera` bindings, can't be pip-installed |

**Packages installed via pip (inside venv):**
| Package | Version Note |
|---------|-------------|
| `numpy` | **1.26.4** (overrides system 1.24 — needed for scipy/insightface) |
| `mediapipe` | Latest |
| `requests` | Latest |
| `onnxruntime` | Latest |
| `insightface` | Latest |

### Step 4.6 — Verify All Packages Installed

```bash
python -c "import cv2; print('OpenCV:', cv2.__version__)"
python -c "import mediapipe; print('MediaPipe OK')"
python -c "import onnxruntime; print('ONNX Runtime:', onnxruntime.__version__)"
python -c "import insightface; print('InsightFace OK')"
python -c "import numpy; print('NumPy:', numpy.__version__)"
python -c "from picamera2 import Picamera2; print('Picamera2 OK')"
python -c "import requests; print('Requests OK')"
```

All 7 should print without errors. Notes:
- `picamera2` has no `__version__` attribute — just check that the import succeeds.
- You may see a `GPU device discovery failed` warning from onnxruntime — **this is harmless** (RPi4 has no discrete GPU).
- NumPy should show **1.26.4** (the pip version), not 1.24.x (system). If it shows 1.24.x, run `pip install numpy==1.26.4`.

---

## PHASE 5: Make the Camera Work with OpenCV

The Pi Camera V2 connects via the CSI port and uses the **libcamera** stack on Bookworm. Our code handles this automatically — it uses `picamera2` on the Pi and OpenCV on the laptop. You just need to verify it works.

### Step 5.1 — Test Camera Access

```bash
cd ~/frames
source venv/bin/activate
python -c "
from rpi.camera import Camera
cam = Camera(width=480, height=360, fps=15, prefer_picamera2=True)
if cam.isOpened():
    ret, frame = cam.read()
    if ret:
        print(f'SUCCESS! Camera works via {cam.backend_name}')
        print(f'Frame size: {frame.shape[1]}x{frame.shape[0]}')
    else:
        print('FAIL: Camera opened but cannot read frames')
else:
    print('FAIL: Cannot open camera')
cam.release()
"
```

**If it prints "SUCCESS! Camera works via picamera2"** → skip to Phase 6.

**If it fails:**
1. Make sure you installed `python3-picamera2`: `sudo apt install python3-picamera2`
2. Make sure you created the venv with `--system-site-packages`:
   ```bash
   # If you already created the venv without it, recreate:
   rm -rf ~/frames/venv
   python3 -m venv --system-site-packages ~/frames/venv
   source ~/frames/venv/bin/activate
   pip install --upgrade pip setuptools wheel
   # Then reinstall all Python packages from Phase 4
   ```
3. Test that `rpicam-hello -t 2` works (press Ctrl+C to stop). If that works, `picamera2` should work too.

### Step 5.2 — Troubleshooting: Legacy V4L2 (Only If picamera2 Fails)

Edit the boot config file:
```bash
sudo nano /boot/firmware/config.txt
```

> **Note:** On older Raspberry Pi OS, the file might be at `/boot/config.txt` instead. If `/boot/firmware/config.txt` doesn't exist, try `sudo nano /boot/config.txt`.

Look for a line that says `camera_auto_detect=1`. If it's there, it should be working. If not, add these lines at the **very bottom** of the file:

```
camera_auto_detect=1
start_x=1
gpu_mem=128
```

Save the file: press **Ctrl + O**, then **Enter**, then **Ctrl + X** to exit.

Reboot:
```bash
sudo reboot
```

After the reboot, activate the venv again and re-run the test from Step 5.1:
```bash
cd ~/frames
source venv/bin/activate
python -c "
from rpi.camera import Camera
cam = Camera(width=480, height=360, fps=15, prefer_picamera2=True)
if cam.isOpened():
    ret, frame = cam.read()
    print(f'SUCCESS via {cam.backend_name}!' if ret else 'FAIL: Cannot read frames')
else:
    print('FAIL: Cannot open camera')
cam.release()
"
```

---

## PHASE 6: Copy Your Code from Laptop to Raspberry Pi

Now you need to get your project files from your laptop onto the Pi. Choose ONE of these methods:

### Method A: USB Flash Drive (Easier)

1. On **your laptop**, copy these folders to a USB flash drive:
   - `Capstoneee/backend/rpi/` (entire folder)
   - `Capstoneee/backend/scripts/` (entire folder)

2. Plug the USB drive into the Pi
3. It should auto-mount (a file manager window may pop up). Note the path — usually something like `/media/frames/USB_STICK_NAME/`
4. Open terminal on the Pi and copy:
   ```bash
   cp -r /media/emma/YOUR_USB_NAME/rpi ~/frames/rpi
   cp -r /media/emma/YOUR_USB_NAME/scripts ~/frames/scripts
   ```

### Method B: SCP from Laptop Over WiFi (More Technical)

**FIRST**, create the target directories on the Pi (in your SSH session):
```bash
mkdir -p ~/frames/rpi/data
mkdir -p ~/frames/scripts
```

**THEN**, on **your laptop** (open a **new PowerShell window** — NOT the SSH session), run:
```powershell
# Replace the IP with YOUR Pi's current IP (check with 'hostname -I' on the Pi)
scp -r C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend\rpi emma@10.244.181.134:~/frames/
scp -r C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend\scripts emma@10.244.181.134:~/frames/
```

> **WATCH OUT for trailing backslashes!** `scp -r ..\rpi\` (with backslash) creates a nested `rpi/rpi/` on the Pi. Use `..\rpi` (no trailing backslash) to copy the folder correctly.
>
> **SCP runs on your LAPTOP, not the Pi.** If you paste it into the SSH session, it will fail because the Pi doesn't have `C:\Users\...`.

It will ask for the password you set during OS flashing. Type it and press Enter (the password won't show as you type — that's normal).

**If you get an error like `No such file`:** Make sure you created the directories on the Pi first (the `mkdir -p` command above).

**If files end up nested (`~/frames/rpi/rpi/`):** Fix it:
```bash
# On the Pi:
mv ~/frames/rpi/rpi/* ~/frames/rpi/
rmdir ~/frames/rpi/rpi
```

### Method C: SSH + Git (If Your Repo is on GitHub)

On the Pi:
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cp -r YOUR_REPO/Capstoneee/backend/rpi ~/frames/rpi
cp -r YOUR_REPO/Capstoneee/backend/scripts ~/frames/scripts
```

### Verify the Files Are There

After copying (any method), check:
```bash
ls ~/frames/rpi/
```

You should see:
```
config.py  embedding_cache.py  face_detector.py  face_recognizer.py
gesture_detector.py  main_kiosk.py  test_laptop.py  schedule_resolver.py
attendance_logger.py  data/
```

And:
```bash
ls ~/frames/rpi/data/
```

You should see:
```
embeddings_cache.json
```

> **If `embeddings_cache.json` is missing:** You need to export it first from your laptop. On your laptop:
> ```powershell
> cd C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend
> .\venv\Scripts\activate
> python scripts/export_embeddings.py -o rpi/data/embeddings_cache.json
> ```
> Then copy `rpi/data/embeddings_cache.json` to the Pi using any method above.

---

## PHASE 7: First Test on Raspberry Pi

This is the moment of truth — running face recognition on the Pi.

### Step 7.1 — Run the Test Script

**If running via SSH** (from your laptop), you MUST prefix with `DISPLAY=:0` to send the window to the 7" display:
```bash
cd ~/frames
source venv/bin/activate
DISPLAY=:0 python rpi/test_laptop.py
```

**If running directly on the Pi** (with a keyboard plugged in, using the terminal on the 7" display):
```bash
cd ~/frames
source venv/bin/activate
python rpi/test_laptop.py
```

> **Why `DISPLAY=:0`?** When you SSH into the Pi, there's no display attached to your SSH session. `DISPLAY=:0` tells the program to use the Pi's physical screen (the 7" display). Without it, you'll get `could not connect to display` or `Qt platform plugin could not be initialized`.

> **First run downloads the InsightFace model** (~280 MB from GitHub). This is a one-time download that takes 2-5 minutes depending on WiFi speed. It saves to `~/.insightface/models/buffalo_l/` and won't download again.

> **What happens automatically:** The code detects it's running on a Raspberry Pi (because the CPU is `aarch64`), and activates RPi mode:
> - Detection size: 320x320 (faster)
> - Gated detection: ON (MediaPipe gate → InsightFace only when face found)
> - Frame skip: 5 (processes every 5th frame)
> - Camera: 480x360

**What you should see on the 7" display:**
- A camera feed window showing your face
- If you're enrolled, your name and similarity score should appear
- FPS counter in the corner

**Controls:**
- Press `q` on the keyboard to quit
- Press `d` to toggle debug overlay (shows top-3 matches, timing info)

### Step 7.2 — Check If Recognition Works

Stand in front of the camera. If you're enrolled in the system, you should see your name appear.

**If it says "Unknown" for everyone:**
1. Check that `embeddings_cache.json` has data: `cat ~/frames/rpi/data/embeddings_cache.json | head -5`
2. Make sure you enrolled faces on your laptop first through the web frontend
3. Make sure you exported embeddings: `python scripts/export_embeddings.py -o rpi/data/embeddings_cache.json`

**If the camera feed is very laggy:**
- This is normal — on RPi4, expect 3-4 FPS during active recognition
- When no face is in view, it should be smoother (18-28 FPS idle)

### Step 7.3 — Test Gesture Detection

While the test is running:
1. Let it recognize your face first (your name appears)
2. Show a **peace sign** (✌️ — index + middle finger up)
3. Hold it steady for ~1 second (system needs 3 consecutive frames)
4. You should see "PEACE_SIGN detected" or similar

---

## PHASE 8: Run the Kiosk for Real (Production Mode)

Once testing works, you can run the actual kiosk application that logs attendance to your backend.

### Step 8.1 — Make Sure Your Backend is Running

On **your laptop**, your FastAPI backend must be running:
```powershell
cd C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend
.\venv\Scripts\activate
python main.py
```

Note the URL it prints (usually `http://0.0.0.0:8000` or `http://localhost:8000`). From the Pi, you'll use your **laptop's IP address** instead of `localhost`. Find your laptop's IP:
```powershell
ipconfig
```
Look for your WiFi adapter's **IPv4 Address** (something like `192.168.1.100`).

### Step 8.2 — Register the Kiosk as a Device in the Database

Your kiosk needs a row in the `devices` table. You can add this through your admin dashboard or directly in the database:

| Column | Value | Explanation |
|--------|-------|-------------|
| `id` | 1 | Unique device ID |
| `room` | "CL1" | The classroom this kiosk is in |
| `device_name` | "KIOSK-CL1" | A friendly name |
| `status` | "ACTIVE" | Must be active to work |

### Step 8.3 — Start the Kiosk

On the **Raspberry Pi** terminal:
```bash
cd ~/frames
source venv/bin/activate

# Set environment variables (replace with YOUR values)
export DEVICE_ID=1
export BACKEND_URL=http://192.168.1.100:8000
export DEVICE_ROOM=CL1

# Run the kiosk (use DISPLAY=:0 if running via SSH)
DISPLAY=:0 python rpi/main_kiosk.py
```

> **If running directly on the Pi** (keyboard + terminal on 7" display), you can omit `DISPLAY=:0`.

**What you should see in the terminal:**
```
============================================================
   FRAMES Attendance Kiosk - Initializing
============================================================
🔄 Loading face detector (MediaPipe)...
🔄 Loading face recognizer (InsightFace)...
🔄 Loading gesture detector (MediaPipe Hands)...
📥 Loading embedding cache...
📅 Initializing schedule resolver...
📤 Initializing attendance logger...
============================================================
✅ Kiosk initialized | Device ID: 1
   Platform: RPI
============================================================
```

### Step 8.4 — Test the Full Flow

1. Stand in front of the kiosk camera
2. Wait for face recognition (your name should appear)
3. Show the required gesture:
   - ✌️ **Peace sign** (index + middle finger) → Break Out
   - 👍 **Thumbs up** → Break In
   - 🖐 **Open palm** (all 5 fingers) → Exit
4. Check your web dashboard — the attendance should appear in real time

---

## PHASE 9: Fix the 7" Display Resolution (If Needed)

If the display looks wrong (text too big, too small, or cut off), you may need to set the resolution manually.

```bash
sudo nano /boot/firmware/config.txt
```

Add at the bottom:
```
# 7 inch HDMI display - 1024x600
hdmi_group=2
hdmi_mode=87
hdmi_cvt=1024 600 60 3 0 0 0
```

Save (**Ctrl+O**, **Enter**, **Ctrl+X**) and reboot:
```bash
sudo reboot
```

If the display still looks wrong after this, try:
```
# Alternative settings
hdmi_group=2
hdmi_mode=87
hdmi_cvt=1024 600 60 6 0 0 0
hdmi_drive=2
```

---

## PHASE 10: Auto-Start the Kiosk on Boot (Optional)

So the Pi starts the kiosk automatically when it powers on, without needing to type commands:

### Step 10.1 — Create a Startup Script

```bash
nano ~/frames/start_kiosk.sh
```

Paste this (replace the values with yours):
```bash
#!/bin/bash
cd ~/frames
source venv/bin/activate
export DEVICE_ID=1
export BACKEND_URL=http://192.168.1.100:8000
export DEVICE_ROOM=CL1
python rpi/main_kiosk.py
```

Save and make it executable:
```bash
chmod +x ~/frames/start_kiosk.sh
```

### Step 10.2 — Create a Systemd Service

```bash
sudo nano /etc/systemd/system/frames-kiosk.service
```

Paste this:
```ini
[Unit]
Description=FRAMES Attendance Kiosk
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=emma
WorkingDirectory=/home/emma/frames
ExecStart=/home/emma/frames/start_kiosk.sh
Restart=on-failure
RestartSec=10
Environment=DISPLAY=:0

[Install]
WantedBy=multi-user.target
```

Save and exit. Then enable it:
```bash
sudo systemctl enable frames-kiosk.service
```

Now it will start automatically on every boot. To control it manually:
```bash
sudo systemctl start frames-kiosk    # Start now
sudo systemctl stop frames-kiosk     # Stop
sudo systemctl restart frames-kiosk  # Restart
sudo systemctl status frames-kiosk   # Check if running
```

---

## File Structure

```
~/frames/                            (on Raspberry Pi)
├── venv/                            # Python virtual environment
├── start_kiosk.sh                   # Auto-start script
├── rpi/                             # Kiosk code
│   ├── camera.py                    # Camera abstraction (picamera2 on RPi, OpenCV on laptop)
│   ├── config.py                    # Settings (auto-detects RPi mode)
│   ├── face_detector.py             # MediaPipe BlazeFace face detection
│   ├── face_recognizer.py           # InsightFace buffalo_l embedding extraction
│   ├── gesture_detector.py          # MediaPipe Hands gesture detection
│   ├── embedding_cache.py           # Local JSON cache for offline matching
│   ├── schedule_resolver.py         # Room-based class schedule lookup
│   ├── attendance_logger.py         # Backend API + offline queue
│   ├── main_kiosk.py               # Main attendance loop (production)
│   ├── test_laptop.py              # Test script with debug overlay
│   └── data/
│       └── embeddings_cache.json   # Exported face embeddings from server
│
└── scripts/
    └── export_embeddings.py         # Export embeddings from database
```

---

## How the Recognition Pipeline Works

```
Camera captures frame
       │
       ▼
Frame Skip: process every 5th frame (saves CPU)
       │
       ▼
Stage 1: MediaPipe BlazeFace (~30ms)
├── No face found? → Skip frame, back to camera (costs only ~30ms)
└── Face found + big enough (>80px)?
       │
       ▼
Stage 2: InsightFace buffalo_l, ONNX Runtime (~200ms)
├── Extracts 512-dimensional face embedding
├── Compares against all enrolled faces (cosine similarity)
├── Match score ≥ 0.35? → Recognized!
└── Match score < 0.35? → Unknown, back to camera
       │
       ▼
Stage 3: Gesture Confirmation (MediaPipe Hands)
├── ✌️  Peace sign → BREAK OUT
├── 👍  Thumbs up  → BREAK IN
├── 🖐  Open palm  → EXIT
├── Must hold gesture for 3 consecutive frames (~1 second)
└── 8-second timeout before giving up
       │
       ▼
Log attendance → POST to backend API → Dashboard updates in real time
       │
       └── If network fails → save locally, sync later
```

**Performance on RPi4:**

| State | Speed | FPS |
|-------|-------|-----|
| Idle (no face visible) | ~35ms/frame | ~28 FPS |
| Face detected + recognition | ~230ms | ~3-4 FPS |
| Face + recognition + gesture | ~310ms | Acceptable |
| **End-to-end** (recognize → API → dashboard) | **< 1 second** | — |

---

## Configuration Reference

All settings are in `rpi/config.py`. The code **auto-detects** whether it's running on your laptop or on the Pi and adjusts automatically:

| Setting | Laptop Mode | RPi Mode | What It Does |
|---------|:-----------:|:--------:|-------------|
| `RECOGNITION_DET_SIZE` | (640, 640) | (320, 320) | Smaller = faster detection |
| `USE_GATED_DETECTION` | OFF | ON | MediaPipe pre-filter before InsightFace |
| `RECOGNITION_FRAME_SKIP` | 1 (every frame) | 5 (every 5th) | Reduces CPU load |
| `CAMERA_WIDTH` | 640 | 480 | Lower resolution = faster |
| `CAMERA_HEIGHT` | 480 | 360 | Lower resolution = faster |
| `CAMERA_FPS` | 30 | 15 | Lower FPS = less CPU |
| `INSIGHTFACE_MODEL` | buffalo_l | buffalo_l | **Same model on both** |
| `USE_PICAMERA2` | OFF | ON | picamera2 for Pi Camera on Bookworm |
| `MATCH_THRESHOLD` | 0.35 | 0.35 | Cosine similarity threshold |
| `GESTURE_CONSECUTIVE_FRAMES` | 3 | 3 | Frames of steady gesture needed |
| `COOLDOWN_SECONDS` | 10 | 10 | Prevent duplicate scans |

You do NOT need to change any settings. It auto-configures for RPi.

---

## Backend API Endpoints (What the Kiosk Talks To)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/kiosk/active-class?device_id=X` | GET | What class is happening in this room right now? |
| `/api/kiosk/schedule?device_id=X` | GET | Get the weekly schedule for this room (cached locally) |
| `/api/kiosk/attendance/log` | POST | Log an attendance event |
| `/api/kiosk/device/{id}` | GET | Get device info |
| `/api/kiosk/device/{id}/heartbeat` | POST | Tell backend "I'm still alive" |

---

## Updating Enrolled Faces

When new users enroll via the web frontend, the kiosk doesn't automatically know about them. You need to re-export the embeddings:

### On Your Laptop:
```powershell
cd C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend
.\venv\Scripts\activate
python scripts/export_embeddings.py -o rpi/data/embeddings_cache.json
```

### Copy to the Pi:
```powershell
scp C:\Users\Emmanuel\Documents\OURCAPSTONE\Capstoneee\backend\rpi\data\embeddings_cache.json emma@10.244.181.134:~/frames/rpi/data/
```

### Restart the Kiosk:
On the Pi:
```bash
sudo systemctl restart frames-kiosk
```
Or if running manually, just press `q` to quit and re-run `python rpi/main_kiosk.py`.

---

## Troubleshooting

### Camera Not Detected
| Check | How |
|-------|-----|
| Cable orientation | Blue side faces Ethernet port, silver contacts face HDMI ports |
| Cable seated? | Power off, re-seat the cable, power on |
| Camera enabled? | `sudo raspi-config` → Interface Options → Camera → Enable → Reboot |
| V4L2 driver? | `ls /dev/video*` — should show `/dev/video0` |

### Display Issues
| Problem | Fix |
|---------|-----|
| Black screen | Try the other HDMI port |
| Wrong resolution | Add `hdmi_cvt=1024 600 60 3 0 0 0` to boot config (see Phase 9) |
| Touch not working | Make sure the USB cable from display is connected to Pi |
| Upside down | Add `display_rotate=2` to `/boot/firmware/config.txt` |

### Python / Package Errors
| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'cv2'` | `pip install opencv-python` (make sure venv is active!) |
| `module 'mediapipe' has no attribute 'solutions'` | `pip uninstall mediapipe -y && pip install mediapipe` |
| Camera opens but can't read frames | Install `python3-picamera2` and recreate venv with `--system-site-packages` (see Phase 4) |
| `ModuleNotFoundError: No module named 'picamera2'` | `sudo apt install python3-picamera2` + venv needs `--system-site-packages` |
| `onnxruntime` won't install | See Phase 4, Step 4.5 for ARM64 alternatives |
| `insightface` model download hangs | First run downloads ~200MB. Be patient on slow WiFi |

### NumPy / ABI Compatibility Issues
| Problem | Fix |
|---------|-----|
| `ValueError: numpy.dtype size changed` | You have the wrong NumPy version. Run `pip uninstall numpy -y` then `pip install numpy==1.26.4` |
| `scipy` / `insightface` imports fail with `No module named 'numpy.exceptions'` | System numpy (1.24) is too old. Install `pip install numpy==1.26.4` |
| `cv2.imshow` crashes: "not implemented, rebuild with GTK+" | You installed `opencv-python` via pip. Run `pip uninstall opencv-python opencv-python-headless -y` to fall back to system OpenCV (has GTK) |
| `could not connect to display` / Qt plugin error | Add `DISPLAY=:0` before the command: `DISPLAY=:0 python rpi/test_laptop.py` |

### Recognition Issues
| Problem | Fix |
|---------|-----|
| Everyone is "Unknown" | Check `embeddings_cache.json` exists and isn't empty |
| Low similarity scores | Ensure good lighting on face, face the camera straight |
| Very laggy / slow | Normal on RPi4: ~3-4 FPS during recognition, ~28 FPS idle |
| Gesture not detected | Hold gesture steady for ~1 second, ensure hand is visible |

### Network Issues
| Problem | Fix |
|---------|-----|
| Can't reach backend | Check `BACKEND_URL` uses your laptop's IP (not `localhost`) |
| Attendance not showing on dashboard | Check backend is running on laptop, both on same WiFi |
| Offline mode | Attendance is queued locally and synced when connection returns |

---

## Harmless Warnings (Ignore These)

You will see these messages in the terminal — they are **all harmless** and do NOT affect functionality:

| Warning | Why It Appears | Impact |
|---------|---------------|--------|
| `GPU device discovery failed: "/sys/class/drm/card1/device/vendor"` | ONNX Runtime checks for a discrete GPU. RPi4 doesn't have one. | None — it uses CPU instead |
| `Error in cpuinfo: prctl(PR_SVE_GET_VL) failed` | MediaPipe checks for ARM SVE instructions. RPi4's Cortex-A72 doesn't support SVE. | None — falls back to standard NEON |
| `inference_feedback_manager.cc: Feedback manager requires a model with a single signature` | MediaPipe's internal TFLite delegate message. | None — detection still works |
| `WARN RPiSdn: Using legacy SDN tuning` | libcamera message about spatial denoise config format. | None — camera works fine |
| `opencv-python requires numpy>=2` (pip warning) | pip's dependency resolver is strict, but OpenCV works with numpy 1.26.4. | None — ignore the warning |

---

## Security Notes

- Embeddings are stored as JSON (not encrypted) — keep the `embeddings_cache.json` file secure
- The kiosk does **NOT** store passwords, raw face images, or sensitive user data
- Attendance logs include confidence scores for audit purposes
- Gesture verification adds a layer of intentional confirmation (prevents walk-by detections)
- The kiosk communicates with the backend over HTTP — for production, use HTTPS

---

## Quick Reference Card

**Start kiosk manually (via SSH):**
```bash
cd ~/frames && source venv/bin/activate
export DEVICE_ID=1 BACKEND_URL=http://YOUR_LAPTOP_IP:8000
DISPLAY=:0 python rpi/main_kiosk.py
```

**Test mode (via SSH):**
```bash
cd ~/frames && source venv/bin/activate
DISPLAY=:0 python rpi/test_laptop.py
```

**Update face data:**
```bash
# On laptop:
python scripts/export_embeddings.py -o rpi/data/embeddings_cache.json
# Copy to Pi:
scp rpi/data/embeddings_cache.json emma@PI_IP:~/frames/rpi/data/
```

**Check kiosk service:**
```bash
sudo systemctl status frames-kiosk
```

**View kiosk logs:**
```bash
journalctl -u frames-kiosk -f
```
