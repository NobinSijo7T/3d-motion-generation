# Motion AI Studio

Motion AI Studio is a local text-to-motion web app. The React frontend sends a prompt to a FastAPI backend, Groq turns that prompt into a structured motion plan, and a selected local motion engine generates skeleton motion for the Three.js viewer.

The app currently supports three engines:

- `preview`: no setup, procedural skeleton animation for quick testing.
- `humanml3d`: HumanML3D/Text-to-Motion pretrained checkpoint.
- `kimodo`: NVIDIA Kimodo CLI adapter, higher quality but heavier setup.

## Architecture

```text
User prompt
  -> React + TypeScript + Vite UI
  -> FastAPI backend
  -> Groq motion planner
  -> selected local motion engine
       - Quick Preview
       - HumanML3D
       - Kimodo
  -> post-processing + SQLite history
  -> Three.js skeleton viewer + timeline + exports
```

Groq is used only for language planning. The Groq API key stays on the backend in `.env` and is never sent to the frontend.

## 1. Install Python And Node

Install:

- Python 3.11+
- Node.js 20+
- Git

Check:

```powershell
python --version
node --version
npm --version
git --version
```

## 2. Clone This Codebase From Scratch

```powershell
git clone <your-repo-url> motion-3d
cd motion-3d
```

If you already have the folder, open it:

```powershell
cd C:\Users\nobin\OneDrive\Documents\Projects\motion-3d
```

## 3. Backend Setup

```powershell
python -m pip install -r requirements.txt
```

Create `.env` from `.env.example` and add your Groq key:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
MOTION_ENGINE=preview
```

Use `preview` first because it works without model downloads.

## 4. Frontend Setup

```powershell
cd frontend
npm install
cd ..
```

## 5. Run The App

Terminal 1:

```powershell
python -m uvicorn backend.main:app --reload --port 8000
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

## 6. Kimodo Setup

Kimodo is optional. It gives better motion quality, but it downloads large model files and needs Hugging Face access for `meta-llama/Meta-Llama-3-8B-Instruct`.

Install CMake and Visual Studio C++ Build Tools on Windows:

```powershell
winget install Kitware.CMake
winget install Microsoft.VisualStudio.2022.BuildTools
```

In the Visual Studio installer, select `Desktop development with C++`.

Clone and install Kimodo:

```powershell
cd C:\Users\nobin\OneDrive\Documents\Projects\motion-3d
git clone https://github.com/nv-tlabs/kimodo vendor\kimodo
python -m venv .venv-kimodo
.\.venv-kimodo\Scripts\Activate.ps1
python -m pip install --upgrade pip
cd vendor\kimodo
pip install -e .
```

Login to Hugging Face after Meta Llama access is approved:

```powershell
hf auth login
```

Run a small Kimodo smoke test:

```powershell
cd C:\Users\nobin\OneDrive\Documents\Projects\motion-3d\vendor\kimodo
$env:TEXT_ENCODER_DEVICE="cpu"
$env:HF_HUB_DISABLE_XET="1"
$env:HF_HUB_DISABLE_SYMLINKS_WARNING="1"
python -m kimodo.scripts.generate "A person walks forward slowly." --duration 2 --num_samples 1 --diffusion_steps 10 --output ..\..\cache\kimodo-test\walk-fast --save_example_dir
```

Add these to `.env` when using Kimodo:

```env
MOTION_ENGINE=kimodo
KIMODO_PATH=./vendor/kimodo
KIMODO_PYTHON=.venv-kimodo/Scripts/python.exe
KIMODO_MODEL=Kimodo-SOMA-RP-v1.1
KIMODO_TEXT_ENCODER_DEVICE=cpu
KIMODO_DIFFUSION_STEPS=25
```

For 4 GB VRAM GPUs, keep `KIMODO_TEXT_ENCODER_DEVICE=cpu`.

## 7. HumanML3D Pretrained Model Setup

HumanML3D is optional and lighter than Kimodo, but it still needs pretrained checkpoint files.

The text-to-motion repo should exist here:

```text
vendor\text-to-motion
```

If it does not exist:

```powershell
git clone https://github.com/EricGuo5513/text-to-motion vendor\text-to-motion
```

Install the HumanML3D dependencies and CUDA-enabled PyTorch in your project venv:

```powershell
python -m pip install -r vendor/text-to-motion/requirements.txt
python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

Download the HumanML3D pretrained model package:

```text
https://drive.google.com/file/d/1IgrFCnxeg4olBtURUHimzS03ZI0df_6W/view?usp=sharing
```

Extract it so the final folders look like this:

```text
vendor\text-to-motion\checkpoints\t2m\Comp_v6_KLD01\model\latest.tar
vendor\text-to-motion\checkpoints\t2m\length_est_bigru\model\latest.tar
vendor\text-to-motion\checkpoints\t2m\Decomp_SP001_SM001_H512
vendor\text-to-motion\checkpoints\t2m\text_mot_match
```

Verify:

```powershell
Test-Path vendor\text-to-motion\checkpoints\t2m\Comp_v6_KLD01\model\latest.tar
Test-Path vendor\text-to-motion\checkpoints\t2m\length_est_bigru\model\latest.tar
Test-Path vendor\text-to-motion\glove\our_vab_data.npy
```

All three should print `True`.

Use HumanML3D from the app by selecting `HumanML3D` in the model dropdown, or set:

```env
MOTION_ENGINE=humanml3d
MOTION_ENGINE_PATH=./vendor/text-to-motion
MOTION_CHECKPOINT=Comp_v6_KLD01
```

## 8. Verify

Backend tests:

```powershell
python -m pytest
```

Frontend build:

```powershell
cd frontend
npm run build
```

Health endpoint:

```text
http://127.0.0.1:8000/api/health
```

The response lists available engines:

```json
{
  "available_engines": [
    { "id": "preview", "available": true },
    { "id": "humanml3d", "available": true },
    { "id": "kimodo", "available": true }
  ]
}
```

## Notes

- `.env` is ignored by git and should contain secrets only on your machine.
- Kimodo may need 17 GB or more of Hugging Face cache space.
- HumanML3D uses an older research stack, so run it separately from the main backend environment if dependency conflicts appear.
- The frontend model dropdown controls which backend engine is used for generation.
