# Motion AI Studio - Quick Start Guide

Get up and running with Motion AI Studio in under 10 minutes.

## Prerequisites Checklist

Before starting, ensure you have:

- ✅ NVIDIA GPU (RTX 3050 or better)
- ✅ CUDA installed (`nvidia-smi` works)
- ✅ Python 3.10+ installed
- ✅ Node.js 18+ installed
- ✅ Git installed

## Step-by-Step Setup

### 1. Clone and Enter Directory (30 seconds)

```bash
git clone https://github.com/yourusername/motion-ai-studio.git
cd motion-ai-studio
```

### 2. Backend Setup (2 minutes)

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup (1 minute)

```bash
cd frontend
npm install
cd ..
```

### 4. Get Groq API Key (2 minutes)

1. Visit https://console.groq.com
2. Sign up (free)
3. Create API key
4. Copy the key

### 5. Configure Environment (1 minute)

```bash
cp .env.example .env
nano .env  # or your editor
```

**Edit this line:**
```bash
GROQ_API_KEY=your_groq_api_key_here
```

Save and exit.

### 6. Download Motion Model (3 minutes)

```bash
# Clone model repository
git clone https://github.com/EricGuo5513/text-to-motion.git vendor/text-to-motion

# Create checkpoint directory
mkdir -p models/checkpoints

# Download checkpoint (follow instructions in vendor/text-to-motion/README.md)
# Place checkpoint in models/checkpoints/
```

### 7. Start Application (30 seconds)

**Terminal 1 - Backend:**
```bash
source venv/bin/activate
python -m uvicorn backend.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 8. Open Browser

Navigate to: **http://localhost:5173**

## First Motion Generation

1. You'll see the prompt editor with example text
2. Click **Generate Motion** (or press Ctrl+Enter)
3. Wait 5-10 seconds
4. Watch your 3D skeleton animate!

## Example Prompts to Try

```text
A person walks forward.
A person sits down and stands up.
A person waves with the right hand.
A person jumps twice.
A person walks, turns around, and stops.
```

## Verify Everything Works

### Check Backend Health

```bash
curl http://localhost:8000/api/health
```

Should return:
```json
{
  "status": "ok",
  "groq_configured": true,
  "cuda_available": true,
  "motion_model_available": true
}
```

### Check Frontend

1. Open http://localhost:5173
2. You should see "Motion AI Studio" interface
3. 3D viewport should show grid and axes

## Common Issues

### "CUDA not available"
```bash
# Verify CUDA
nvidia-smi
nvcc --version

# Reinstall PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### "Groq API key not configured"
```bash
# Check .env file
cat .env | grep GROQ_API_KEY

# Make sure key is valid and has no quotes/spaces
```

### "Motion checkpoint not found"
```bash
# Verify checkpoint exists
ls -la models/checkpoints/

# Update .env with correct checkpoint name
```

### "Port already in use"
```bash
# Backend - use different port
uvicorn backend.main:app --port 8001

# Frontend - use different port  
npm run dev -- --port 5174
```

## Next Steps

- ✨ Generate your first motion
- 📖 Read [README.md](README.md) for detailed features
- 🔧 Check [SETUP.md](SETUP.md) for advanced configuration
- 🎨 Explore the timeline and playback controls
- 💾 Export motions in NPY, NPZ, or JSON format

## Need Help?

- **Full Setup Guide**: [SETUP.md](SETUP.md)
- **API Documentation**: http://localhost:8000/docs
- **Frontend Guide**: [frontend/README.md](frontend/README.md)
- **GitHub Issues**: Report bugs or ask questions

---

**That's it! You're ready to generate AI-powered 3D human motions! 🎉**
