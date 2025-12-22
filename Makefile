PYTHON ?= python3
BACKEND_DIR := lockedin-backend
FRONTEND_DIR := lockedin-frontend
VENV := $(BACKEND_DIR)/venv
UVICORN_PORT ?= 8000
VITE_PORT ?= 5173
# Set OPENAI_API_KEY environment variable before running
# Example: OPENAI_API_KEY=sk-... make backend
OPENAI_API_KEY ?=

.PHONY: setup install-backend install-frontend backend frontend dev clean-venv

setup: install-backend install-frontend ## Install backend + frontend deps

install-backend: ## Create venv (if missing) and install backend deps
	test -d $(VENV) || $(PYTHON) -m venv $(VENV)
	$(VENV)/bin/pip install -r $(BACKEND_DIR)/requirements.txt

install-frontend: ## Install frontend deps
	cd $(FRONTEND_DIR) && npm install

backend: ## Run FastAPI backend (reload on change)
	OPENAI_API_KEY=$(OPENAI_API_KEY) $(VENV)/bin/python -m uvicorn app.main:app --app-dir $(BACKEND_DIR) --reload --host 0.0.0.0 --port $(UVICORN_PORT)

frontend: ## Run Vite frontend
	cd $(FRONTEND_DIR) && npm run dev -- --host --port $(VITE_PORT)

dev: ## Run backend + frontend together (press Ctrl+C to stop both)
	OPENAI_API_KEY=$(OPENAI_API_KEY) $(VENV)/bin/python -m uvicorn app.main:app --app-dir $(BACKEND_DIR) --reload --host 0.0.0.0 --port $(UVICORN_PORT) &
	cd $(FRONTEND_DIR) && npm run dev -- --host --port $(VITE_PORT) &
	wait

clean-venv: ## Remove backend venv
	rm -rf $(VENV)

