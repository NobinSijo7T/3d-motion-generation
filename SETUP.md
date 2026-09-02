# Motion AI Studio - Complete Setup Guide

This guide will walk you through setting up Motion AI Studio from scratch on Windows with WSL2/Ubuntu, or native Linux.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Initial System Setup](#initial-system-setup)
3. [NVIDIA & CUDA Setup](#nvidia--cuda-setup)
4. [Python Environment](#python-environment)
5. [Node.js Setup](#nodejs-setup)
6. [Backend Setup](#backend-setup)
7. [Frontend Setup](#frontend-setup)
8. [Motion Model Installation](#motion-model-installation)
9. [Configuration](#configuration)
10. [First Run](#first-run)
11. [Verification](#verification)
12. [Troubleshooting](#troubleshooting)

## System Requirements

### Hardware
- **RAM**: 8 GB minimum, 16 GB recommended
- **GPU**: NVIDIA RTX 3050 (4 GB VRAM) or better
- **Storage**: 10 GB free space
- **CPU**: Modern multi-core processor

### Software
- **OS**: Windows 10/11 with WSL2, Ubuntu 20.04+, or compatible Linux
- **CUDA**: 11.8+ or 12.x
- **Python**: 3.10 or 3.11
- **Node.js**: 18+
- **npm**: 9+

## Initial System Setup

### Windows Users (WSL2)

1. **Enable WSL2**:
   ```powershell
   # Run in PowerShell as Administrator
   wsl --install
   wsl --set-default-version 2
   ```

2. **Install Ubuntu**:
   ```powershell
   wsl --install -d Ubuntu-22.04
   ```

3. **Launch Ubuntu**:
   ```powershell
   wsl
   ```

4. **Update system**:
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

### Ubuntu/Linux Users

```bash
sudo apt update
sudo apt upgrade -y
```

### Install Essential Tools

```bash
sudo apt install -y \
  git \
  wget \
  curl \
  unzip \
  build-essential \
  cmake \
  pkg-config \
  ffmpeg \
  libgl1-mesa-glx \
  libglib2.0-0 \
  libsm6 \
  libxext6 \
  libxrender-dev
```

## NVIDIA & CUDA Setup

### 1. Verify GPU Availability

```bash
# Should show your NVIDIA GPU
nvidia-smi
```

**Expected Output:**
```
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 525.xx.xx    Driver Version: 525.xx.xx    CUDA Version: 12.x  |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|===============================+======================+======================|
|   0  NVIDIA GeForce ... Off  | 00000000:01:00.0 Off |                  N/A |
| ...
```

### 2. Install CUDA Toolkit (if needed)

**Check CUDA version:**
```bash
nvcc --version
```

**If CUDA is not installed:**

```bash
# For CUDA 11.8
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-ubuntu2204.pin
sudo mv cuda-ubuntu2204.pin /etc/apt/preferences.d/cuda-repository-pin-600
wget https://developer.download.nvidia.com/compute/cuda/11.8.0/local_installers/cuda-repo-ubuntu2204-11-8-local_11.8.0-520.61.05-1_amd64.deb
sudo dpkg -i cuda-repo-ubuntu2204-11-8-local_11.8.0-520.61.05-1_amd64.deb
sudo cp /var/cuda-repo-ubuntu2204-11-8-local/cuda-*-keyring.gpg /usr/share/keyrings/
sudo apt update
sudo apt install -y cuda-11-8
```

**Add CUDA to PATH:**
```bash
echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

### 3. Verify CUDA Installation

```bash
nvcc --version
nvidia-smi
```

## Python Environment

### 1. Install Python 3.10+

```bash
# Check current version
python3 --version

# If version is < 3.10, install:
sudo apt install -y python3.10 python3.10-venv python3.10-dev python3-pip
```

### 2. Upgrade pip

```bash
python3 -m pip install --upgrade pip setuptools wheel
```

## Node.js Setup

### 1. Install Node Version Manager (nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

**Reload shell:**
```bash
source ~/.bashrc
# or
source ~/.zshrc
```

### 2. Install Node.js 18+

```bash
nvm install 18
nvm use 18
nvm alias default 18
```

### 3. Verify Installation

```bash
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

## Backend Setup

### 1. Clone Repository

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/yourusername/motion-ai-studio.git
cd motion-ai-studio
```

**Or if you already have the files:**
```bash
cd /path/to/motion-ai-studio
```

### 2. Create Python Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

**Your prompt should now show `(venv)`.**

### 3. Install Python Dependencies

```bash
pip install --upgrade pip

# Core dependencies
pip install fastapi uvicorn[standard]
pip install pydantic pydantic-settings
pip install python-dotenv
pip install sqlalchemy aiofiles
pip install groq

# Scientific computing
pip install numpy scipy

# PyTorch with CUDA 11.8
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Or for CUDA 12.1
# pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

**Or install from requirements.txt:**
```bash
pip install -r requirements.txt
```

### 4. Verify PyTorch CUDA

```bash
python3 -c "import torch; print(f'CUDA Available: {torch.cuda.is_available()}'); print(f'CUDA Device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else None}')"
```

**Expected Output:**
```
CUDA Available: True
CUDA Device: NVIDIA GeForce RTX 3050
```

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

**This will install:**
- React + React DOM
- TypeScript
- Vite
- Three.js + React Three Fiber
- Tailwind CSS
- Lucide Icons
- Testing libraries

### 3. Verify Installation

```bash
npm run build
```

**Expected Output:**
```
vite v5.4.x building for production...
✓ 2184 modules transformed.
dist/index.html                   0.40 kB
dist/assets/index-xxxxxx.css     12.39 kB
dist/assets/index-xxxxxx.js     996.25 kB
✓ built in 5.06s
```

## Motion Model Installation

### 1. Clone HumanML3D Repository

```bash
cd ~/projects/motion-ai-studio
mkdir -p vendor
cd vendor
git clone https://github.com/EricGuo5513/text-to-motion.git
```

### 2. Create Checkpoint Directory

```bash
cd ~/projects/motion-ai-studio
mkdir -p models/checkpoints
```

### 3. Download Model Checkpoint

**Option A: Manual Download**

Visit the HumanML3D repository and follow their instructions to download the `Comp_v6_KLD01` checkpoint.

**Typical structure:**
```
models/checkpoints/
└── t2m/
    └── Comp_v6_KLD01/
        ├── model.ckpt
        ├── opt.txt
        └── ...
```

**Option B: Using wget (if direct link available)**

```bash
cd models/checkpoints
# Follow instructions from text-to-motion README
# Usually involves downloading from their release page
```

### 4. Verify Checkpoint

```bash
ls -la models/checkpoints/
# Should show your checkpoint directory
```

## Configuration

### 1. Create Environment File

```bash
cd ~/projects/motion-ai-studio
cp .env.example .env
```

### 2. Get Groq API Key

1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Copy the generated key

### 3. Edit .env File

```bash
nano .env
# or
vim .env
# or use your preferred editor
```

**Update these values:**

```bash
# REQUIRED: Your Groq API key
GROQ_API_KEY=your_groq_api_key_here

# Verify model name (check Groq documentation for current models)
GROQ_MODEL=llama-3.3-70b-versatile

# Default values (usually don't need to change)
APP_HOST=0.0.0.0
APP_PORT=8000
FRONTEND_URL=http://localhost:5173
GPU_ID=0
FPS=20
MAX_DURATION=9
MAX_VARIATIONS=3
OUTPUT_DIR=./outputs
CACHE_DIR=./cache
MOTION_ENGINE_PATH=./vendor/text-to-motion
MOTION_CHECKPOINT=Comp_v6_KLD01
DATABASE_PATH=./cache/motions.db
```

**Save and exit** (Ctrl+X, then Y in nano).

### 4. Create Required Directories

```bash
mkdir -p outputs/motions outputs/exports outputs/previews
mkdir -p cache logs
```

### 5. Set Permissions

```bash
chmod 600 .env  # Protect API key
```

## First Run

### 1. Start Backend

**Terminal 1:**
```bash
cd ~/projects/motion-ai-studio
source venv/bin/activate
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Keep this terminal running.**

### 2. Start Frontend

**Terminal 2:**
```bash
cd ~/projects/motion-ai-studio/frontend
npm run dev
```

**Expected Output:**
```
VITE v5.4.x  ready in 324 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**Keep this terminal running.**

### 3. Open Browser

Navigate to:
```
http://localhost:5173
```

You should see the Motion AI Studio interface!

## Verification

### 1. Test Health Endpoint

**Terminal 3:**
```bash
curl http://localhost:8000/api/health | jq
```

**Expected Response:**
```json
{
  "status": "ok",
  "groq_configured": true,
  "cuda_available": true,
  "motion_model_available": true,
  "gpu": "NVIDIA GeForce RTX 3050"
}
```

### 2. Test Motion Planning

```bash
curl -X POST http://localhost:8000/api/plan \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A person walks forward."}' | jq
```

**Expected Response:**
```json
{
  "original_prompt": "A person walks forward.",
  "style": "natural",
  "speed": 1.0,
  "total_duration": 2.5,
  "actions": [
    {
      "action": "walk",
      "motion_prompt": "a person walks forward naturally",
      "duration": 2.5,
      ...
    }
  ]
}
```

### 3. Generate First Motion (Web UI)

1. In browser at `http://localhost:5173`
2. Enter prompt: "A person walks forward."
3. Click **Generate Motion** or press **Ctrl+Enter**
4. Watch the 3D viewer for skeleton animation

**Expected Result:**
- Status changes to "PLANNING + GENERATING"
- After 5-10 seconds, 3D skeleton appears
- Timeline shows motion breakdown
- Playback controls become active

### 4. Run Frontend Tests

```bash
cd ~/projects/motion-ai-studio/frontend
npm run test
```

**Expected Output:**
```
✓ src/components/ErrorBanner.test.tsx (3)
✓ src/hooks/usePlayback.test.ts (7)

Test Files  2 passed (2)
Tests  10 passed (10)
```

## Troubleshooting

### Backend Won't Start

**Error: `ModuleNotFoundError: No module named 'fastapi'`**
```bash
# Activate venv and reinstall
source venv/bin/activate
pip install -r requirements.txt
```

**Error: `CUDA not available`**
```bash
# Check CUDA installation
nvidia-smi
nvcc --version

# Reinstall PyTorch with correct CUDA version
pip uninstall torch torchvision torchaudio
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**Error: `Groq API key not configured`**
```bash
# Check .env file
cat .env | grep GROQ_API_KEY

# Make sure the key matches the format shown in the Groq console.
# Verify no extra spaces or quotes
```

### Frontend Won't Start

**Error: `npm: command not found`**
```bash
# Install Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 18
```

**Error: Build fails with TypeScript errors**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Motion Generation Fails

**Error: `CUDA out of memory`**
```bash
# Edit .env
MAX_DURATION=6  # Reduce from 9
MAX_VARIATIONS=1

# Or use CPU (slower)
GPU_ID=-1
```

**Error: `Motion checkpoint not found`**
```bash
# Verify checkpoint location
ls -la models/checkpoints/

# Check path in .env
cat .env | grep MOTION_CHECKPOINT

# Ensure path matches actual checkpoint directory structure
```

**Error: `Groq API rate limit`**
- Wait 60 seconds between requests
- Check your Groq console for rate limits
- Consider upgrading Groq plan for higher limits

### 3D Viewer Issues

**Black screen in viewer:**
1. Open browser console (F12)
2. Check for WebGL errors
3. Verify browser supports WebGL 2.0: https://get.webgl.org/webgl2/

**Skeleton not animating:**
1. Check Network tab for failed API requests
2. Verify motion data loaded (check response in Network tab)
3. Try clicking Play button
4. Check browser console for JavaScript errors

### Port Already in Use

**Backend port 8000:**
```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn backend.main:app --port 8001
```

**Frontend port 5173:**
```bash
# Use different port
npm run dev -- --port 5174
```

## Production Deployment

### Build Frontend

```bash
cd frontend
npm run build
```

Output in `frontend/dist/` can be served with nginx or Apache.

### Run Backend with Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app --bind 0.0.0.0:8000
```

### Environment Variables for Production

```bash
# .env.production
GROQ_API_KEY=your_production_key
APP_HOST=0.0.0.0
APP_PORT=8000
FRONTEND_URL=https://yourdomain.com
DATABASE_PATH=/var/lib/motion-ai-studio/motions.db
OUTPUT_DIR=/var/lib/motion-ai-studio/outputs
```

## Next Steps

- Read [README.md](README.md) for usage guide
- Check [frontend/README.md](frontend/README.md) for frontend details
- Explore API endpoints in browser: `http://localhost:8000/docs`
- Join our community discussions
- Report issues on GitHub

## Getting Help

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share tips
- **Documentation**: Check README files in each directory

---

**Setup complete! You're ready to generate amazing 3D human motions! 🎉**
