.PHONY: install install-frontend test build dev-backend dev-frontend

install:
	python -m pip install -r requirements.txt
	cd frontend && npm install

install-frontend:
	cd frontend && npm install

test:
	python -m pytest

build:
	cd frontend && npm run build

dev-backend:
	python -m uvicorn backend.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev
