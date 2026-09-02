# Contributing to Motion AI Studio

Thank you for your interest in contributing to Motion AI Studio! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Submitting Changes](#submitting-changes)
8. [Reporting Bugs](#reporting-bugs)
9. [Requesting Features](#requesting-features)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity, experience level, nationality, personal appearance, race, religion, or sexual orientation.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Accepting constructive criticism gracefully
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable behavior includes:**
- Harassment, trolling, or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other conduct inappropriate in a professional setting

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git
- NVIDIA GPU with CUDA (for motion generation testing)
- Groq API key

### Fork and Clone

1. **Fork** the repository on GitHub
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/motion-ai-studio.git
   cd motion-ai-studio
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/motion-ai-studio.git
   ```

## Development Setup

### Backend Development

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install development tools
pip install black flake8 pytest pytest-cov mypy

# Run backend
python -m uvicorn backend.main:app --reload
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests in watch mode
npm run test:watch
```

## Making Changes

### Branch Strategy

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Branch naming conventions:**
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `docs/` - Documentation only
   - `refactor/` - Code refactoring
   - `test/` - Adding tests

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring without behavior change
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(viewer): add camera reset button
fix(api): handle empty motion plan gracefully
docs(readme): update installation instructions
refactor(timeline): extract ruler component
test(playback): add usePlayback hook tests
```

### Keep Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream main
git checkout main
git merge upstream/main

# Rebase your feature branch
git checkout feature/your-feature
git rebase main
```

## Coding Standards

### Python (Backend)

**Style Guide:**
- Follow [PEP 8](https://pep8.org/)
- Use [Black](https://black.readthedocs.io/) for formatting
- Max line length: 100 characters
- Use type hints

**Example:**
```python
from typing import Optional

def generate_motion(
    prompt: str,
    duration: Optional[float] = None,
    variations: int = 1
) -> MotionResult:
    """Generate 3D motion from text prompt.
    
    Args:
        prompt: Natural language motion description
        duration: Optional fixed duration in seconds
        variations: Number of variations to generate
        
    Returns:
        MotionResult with generated motion data
    """
    # Implementation
    pass
```

**Format code:**
```bash
black backend/
flake8 backend/
mypy backend/
```

### TypeScript (Frontend)

**Style Guide:**
- Follow [TypeScript guidelines](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- Use functional components with hooks
- Prefer const over let
- Use explicit types over `any`

**Example:**
```typescript
interface MotionViewerProps {
  frames: number[][][];
  frame: number;
  fps: number;
  onResetRef?: (reset: () => void) => void;
}

export function MotionViewer({
  frames,
  frame,
  fps,
  onResetRef
}: MotionViewerProps) {
  // Implementation
}
```

**Format code:**
```bash
npm run format  # (if configured)
npm run lint
```

### React Best Practices

- Use TypeScript for all new components
- Extract reusable logic into custom hooks
- Keep components small and focused
- Use meaningful prop names
- Add prop type definitions
- Avoid inline styles (use Tailwind classes)

### General Guidelines

- Write self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Use descriptive variable names
- Avoid magic numbers (use constants)
- Handle errors gracefully

## Testing

### Backend Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=backend tests/

# Run specific test file
pytest tests/test_motion_engine.py

# Run specific test
pytest tests/test_motion_engine.py::test_generate_motion
```

**Writing Tests:**
```python
import pytest
from backend.motion.engine import MotionEngine

def test_generate_motion_success():
    """Test successful motion generation."""
    engine = MotionEngine()
    result = engine.generate("A person walks forward.")
    
    assert result.success
    assert result.frames > 0
    assert result.joints == 22

def test_generate_motion_empty_prompt():
    """Test motion generation with empty prompt."""
    engine = MotionEngine()
    
    with pytest.raises(ValueError, match="Prompt cannot be empty"):
        engine.generate("")
```

### Frontend Tests

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

**Writing Tests:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PromptEditor } from './PromptEditor';

describe('PromptEditor', () => {
  it('renders textarea', () => {
    render(
      <PromptEditor
        prompt=""
        onChange={() => {}}
        onGenerate={() => {}}
        disabled={false}
      />
    );
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });
});
```

### Test Coverage Requirements

- Backend: Aim for 80%+ coverage
- Frontend: Aim for 70%+ coverage
- All new features must include tests
- Bug fixes should include regression tests

## Submitting Changes

### Pre-submission Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts with main
- [ ] CHANGELOG.md updated (for significant changes)

### Create Pull Request

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open Pull Request** on GitHub

3. **Fill in PR template:**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   Describe how you tested your changes
   
   ## Screenshots (if applicable)
   Add screenshots for UI changes
   
   ## Checklist
   - [ ] Tests pass
   - [ ] Documentation updated
   - [ ] No console warnings
   ```

4. **Request review** from maintainers

### Review Process

- Maintainers will review within 1-3 business days
- Address any feedback or requested changes
- Once approved, a maintainer will merge

### After Merge

1. **Delete your branch:**
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. **Update your fork:**
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

## Reporting Bugs

### Before Reporting

1. Check existing issues for duplicates
2. Verify bug exists in latest version
3. Collect relevant information

### Bug Report Template

```markdown
**Describe the bug**
Clear description of what's wrong

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Actual behavior**
What actually happens

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., Windows 11, Ubuntu 22.04]
- Python version: [e.g., 3.10.5]
- Node version: [e.g., 18.16.0]
- GPU: [e.g., RTX 3050]
- CUDA version: [e.g., 11.8]

**Additional context**
Any other relevant information
```

## Requesting Features

### Feature Request Template

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Screenshots, mockups, examples
```

### Feature Discussion

- Discuss in GitHub Discussions first
- Get community feedback
- Maintainers will review feasibility
- If approved, create issue and implementation PR

## Development Tips

### Running Backend in Debug Mode

```python
# backend/main.py
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug"
    )
```

```bash
python backend/main.py
```

### Frontend Hot Reload

Changes to most files trigger automatic reload. For configuration changes, restart dev server.

### Database Migrations

If database schema changes:

```bash
# Delete existing database
rm cache/motions.db

# Restart backend (recreates database)
python -m uvicorn backend.main:app --reload
```

### Testing with Real GPU

Ensure CUDA is available before running motion generation tests:

```python
import pytest
import torch

@pytest.mark.skipif(
    not torch.cuda.is_available(),
    reason="CUDA not available"
)
def test_cuda_motion_generation():
    # Test that requires GPU
    pass
```

### Debugging Three.js Issues

```typescript
// Enable Three.js debug mode
import * as THREE from 'three';
THREE.Object3D.DefaultUp.set(0, 1, 0);
console.log('THREE version:', THREE.REVISION);
```

## Recognition

Contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## Questions?

- Open a [Discussion](https://github.com/OWNER/motion-ai-studio/discussions)
- Check existing [Issues](https://github.com/OWNER/motion-ai-studio/issues)
- Review [Documentation](README.md)

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

**Thank you for contributing to Motion AI Studio! 🎉**
