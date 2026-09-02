# Motion AI Studio

Motion AI Studio is a local text-to-motion web app. The frontend is React, Vite, and Three.js. The backend is FastAPI. Groq converts a prompt into a structured motion plan, then a selected local engine generates the animation.

Supported engines:

- `preview` - instant procedural animation, no model download.
- `humanml3d` - HumanML3D/Text-to-Motion pretrained checkpoint.
- `kimodo` - NVIDIA Kimodo adapter, heavier setup and larger downloads.

## Architecture

```text
Browser prompt
  -> React + Three.js frontend
  -> FastAPI backend
  -> Groq motion planner
  -> selected motion engine
       - preview procedural engine
       - HumanML3D worker
       - Kimodo CLI worker
  -> motion post-processing
  -> SQLite history + export APIs
  -> Three.js motion viewer
```

Groq is used only for language planning. Motion generation runs locally. Keep your Groq API key in `.env`; it is never sent to the frontend.

## Requirements

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

## 1. Clone the project

```powershell
git clone https://github.com/NobinSijo7T/3d-motion-generation.git motion-3d
cd motion-3d
```

If the folder already exists:

```powershell
cd C:\Users\nobin\OneDrive\Documents\Projects\motion-3d
```

## 2. Backend setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

If PowerShell blocks venv activation:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

For CPU-only Windows installs, use this if PyTorch did not install correctly:

```powershell
python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

Create `.env`:

```powershell
Copy-Item .env.example .env
```

Edit `.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

MOTION_ENGINE=preview
MOTION_ENGINE_PATH=./vendor/text-to-motion
MOTION_CHECKPOINT=Comp_v6_KLD01
GPU_ID=0

KIMODO_PATH=./vendor/kimodo
KIMODO_PYTHON=.venv-kimodo/Scripts/python.exe
KIMODO_MODEL=Kimodo-SOMA-RP-v1.1
KIMODO_TEXT_ENCODER_DEVICE=cpu
KIMODO_DIFFUSION_STEPS=25
```

Start with `MOTION_ENGINE=preview`; it works without model downloads.

## 3. Frontend setup

```powershell
cd frontend
npm install
cd ..
```

## 4. Run the app

Terminal 1:

```powershell
cd C:\Users\nobin\OneDrive\Documents\Projects\motion-3d
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --port 8000
```

Terminal 2:

```powershell
cd C:\Users\nobin\OneDrive\Documents\Projects\motion-3d\frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

## 5. HumanML3D setup

HumanML3D needs the `text-to-motion` repo and pretrained checkpoint files. The `vendor/` folder is ignored by git because it can contain large model files.

Clone the engine:

```powershell
cd C:\Users\nobin\OneDrive\Documents\Projects\motion-3d
git clone https://github.com/EricGuo5513/text-to-motion vendor\text-to-motion
```

Download the HumanML3D pretrained model package:

```text
https://drive.google.com/file/d/1IgrFCnxeg4olBtURUHimzS03ZI0df_6W/view?usp=sharing
```

Extract/copy files so these paths exist:

```text
vendor\text-to-motion\checkpoints\t2m\Comp_v6_KLD01\model\latest.tar
vendor\text-to-motion\checkpoints\t2m\length_est_bigru\model\latest.tar
vendor\text-to-motion\glove\our_vab_data.npy
```

Verify:

```powershell
Test-Path vendor\text-to-motion\checkpoints\t2m\Comp_v6_KLD01\model\latest.tar
Test-Path vendor\text-to-motion\checkpoints\t2m\length_est_bigru\model\latest.tar
Test-Path vendor\text-to-motion\glove\our_vab_data.npy
```

All three should print `True`.

If the old HumanML3D repo fails with `np.float` or `np.int`, patch it:

```powershell
(Get-Content vendor\text-to-motion\common\quaternion.py) -replace 'np\.float', 'float' | Set-Content vendor\text-to-motion\common\quaternion.py
(Get-Content vendor\text-to-motion\motion_loaders\model_motion_loaders.py) -replace 'np\.int', 'int' | Set-Content vendor\text-to-motion\motion_loaders\model_motion_loaders.py
(Get-Content vendor\text-to-motion\scripts\motion_process.py) -replace 'np\.float', 'float' | Set-Content vendor\text-to-motion\scripts\motion_process.py
```

Use HumanML3D:

```env
MOTION_ENGINE=humanml3d
MOTION_ENGINE_PATH=./vendor/text-to-motion
MOTION_CHECKPOINT=Comp_v6_KLD01
GPU_ID=0
```

Smoke test:

```powershell
python scripts\motion_worker.py --text "A person waves with the right hand." --output-id humanml3d-test --repeat-time 1 --engine-path vendor\text-to-motion --checkpoint Comp_v6_KLD01 --gpu-id 0 --output-dir cache\engine
```

If CUDA is unavailable, the worker falls back to CPU.

## 6. Kimodo setup

Kimodo is optional. It downloads large Hugging Face model files and needs approved access to `meta-llama/Meta-Llama-3-8B-Instruct`.

Install Windows build tools:

```powershell
winget install Kitware.CMake
winget install Microsoft.VisualStudio.2022.BuildTools
```

In Visual Studio Installer, select `Desktop development with C++`.

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

Log in to Hugging Face:

```powershell
hf auth login
```

Run a small Kimodo test:

```powershell
cd C:\Users\nobin\OneDrive\Documents\Projects\motion-3d\vendor\kimodo
$env:TEXT_ENCODER_DEVICE="cpu"
$env:HF_HUB_DISABLE_XET="1"
$env:HF_HUB_DISABLE_SYMLINKS_WARNING="1"
python -m kimodo.scripts.generate "A person walks forward slowly." --duration 2 --num_samples 1 --diffusion_steps 10 --output ..\..\cache\kimodo-test\walk-fast --save_example_dir
```

Use Kimodo:

```env
MOTION_ENGINE=kimodo
KIMODO_PATH=./vendor/kimodo
KIMODO_PYTHON=.venv-kimodo/Scripts/python.exe
KIMODO_MODEL=Kimodo-SOMA-RP-v1.1
KIMODO_TEXT_ENCODER_DEVICE=cpu
KIMODO_DIFFUSION_STEPS=25
```

## 7. Prompt behavior

HumanML3D works best with short, concrete body-motion descriptions.

Good prompts:

```text
A person walks forward slowly.
A person waves with the right hand.
A person sits down and stands back up.
A person bends down and picks up an object from the ground.
```

For compound prompts, the backend asks Groq to split the prompt into actions. HumanML3D then generates each action as a separate segment and stitches the motion together.

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

## Git safety

Do not commit secrets or model files. The repo ignores:

- `.env`
- virtual environments
- `vendor/`
- cache/output/log files
- HumanML3D/Kimodo checkpoints
- large model/archive/media formats

Small frontend assets can live in `frontend/public/`.
