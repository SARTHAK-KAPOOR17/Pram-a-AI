# Pramāṇa AI

> **Tagline:**  
> *“Intelligent Verification. Self-Healing Tests.”*

**Pramāṇa AI** is an AI-powered software testing and quality assurance platform designed to make automated tests intelligent, resilient, and self-healing.

The platform leverages **browser automation (Playwright), intelligent failure analysis, and heuristic DOM reasoning** to automatically execute test cases, identify the root cause of breakages, repair outdated selectors with high confidence, and eliminate the maintenance overhead of modern E2E testing.

---

## Current Status: Phase 0 & Phase 1 (Foundation Complete)

We are actively building the foundation on **100% Modern JavaScript (ES6+ / JSX / ESM)**. Advanced AI inference and LLM integrations are scheduled for Phase 4+.

---

## Core Capabilities (Roadmap)

- **AI-Powered Test Execution & Failure Analysis:** Classify broken tests into application defects, test debt, or environmental flakes.
- **Self-Healing Selectors:** Heuristic DOM delta matching with confidence scoring (≥ 0.85 auto-apply gate).
- **Playwright Automation Engine:** High-performance headless browser test runner isolated from API servers.
- **Natural Language Test Authoring:** Transform user stories into executable Playwright JavaScript specs.
- **Flaky-Test Detection:** Variance and timing analysis across historical run matrices.
- **Visual Regression Testing:** Intelligent layout and pixel diffing.
- **Automated Bug Reports:** Structured markdown and Jira/GitHub tickets with reproduction steps.
- **CI/CD Integration:** GitHub Actions, GitLab CI, and webhook dispatch.

---

## Technology Stack

- **Frontend:** React 18, Vite 6, JavaScript (JSX), Tailwind CSS, React Router v6, Axios, TanStack Query v5
- **Backend:** Node.js (v24), Express 4, JavaScript (ES Modules), MongoDB, Mongoose, JWT, bcrypt, Zod
- **Test Engine:** Playwright v1.49, JavaScript
- **DevOps:** Docker, Docker Compose
- **Design Philosophy:** Developer-first, dark-first UI, minimal, clean typography, zero mock AI facades

---

## Repository Structure

```text
pramana-ai/
│
├── frontend/               # React (Vite, JSX, Tailwind, TanStack Query, Axios)
│   ├── src/
│   │   ├── components/     # Reusable UI (Button, Input, Card, Modal, Badge, etc.)
│   │   ├── pages/          # Home, Dashboard, Login, Register, NotFound
│   │   ├── layouts/        # AppLayout with Navbar and Sidebar
│   │   ├── hooks/          # useHealth (polling /api/health)
│   │   ├── services/       # Axios API client
│   │   ├── utils/          # Tailwind class merger (cn)
│   │   ├── App.jsx         # App router and TanStack Query provider
│   │   ├── main.jsx        # React root entrypoint
│   │   └── index.css       # Design system and Tailwind directives
│   ├── public/             # Brand favicon & assets
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                # Node.js + Express + Mongoose REST API (JavaScript ESM)
│   ├── src/
│   │   ├── config/         # Environment (Zod-validated) & MongoDB connection
│   │   ├── controllers/    # Health and Auth controllers
│   │   ├── middleware/     # Error handler, 404, request logger, JWT auth, Zod validator
│   │   ├── models/         # User Mongoose model with bcrypt hashing
│   │   ├── routes/         # Health (/api/health) and Auth (/api/auth) routers
│   │   ├── services/       # Business logic (Auth service)
│   │   ├── utils/          # Logger, AppError, ApiResponse helpers
│   │   ├── validators/     # Zod request schemas
│   │   ├── app.js          # Express app configuration & middleware
│   │   └── server.js       # HTTP server bootstrap & graceful shutdown
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── test-engine/            # Isolated Playwright Browser Execution Environment (JS)
│   ├── tests/
│   │   └── smoke.spec.js   # Headless browser smoke verification test
│   ├── src/
│   │   └── runner.js       # Programmatic execution runner
│   ├── playwright.config.js# Playwright test runner configuration
│   ├── package.json
│   └── README.md
│
├── ai-engine/              # Cognitive Architecture & Data Contracts (Placeholder)
│   ├── src/
│   │   └── contracts.js    # Taxonomies, failure classifications & schemas
│   └── README.md           # Future AI architectural specification
│
├── docs/                   # Architectural & Operational Documentation
│   ├── architecture.md     # Decoupled system flow & self-healing loop
│   ├── development-setup.md# Local development guide
│   ├── database-design.md  # MongoDB schemas & entity relationships
│   └── roadmap.md          # Multi-phase engineering roadmap
│
├── scripts/                # Local development & verification helper scripts
│   ├── dev.ps1             # PowerShell dual-service launcher
│   └── dev.sh              # Bash dual-service launcher
│
├── docker/                 # Service Dockerfiles
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── test-engine.Dockerfile
│
├── docker-compose.yml      # Local containerized orchestration (Mongo, API, UI)
├── .gitignore              # Comprehensive ignores (node_modules, .env, reports)
└── README.md
```

---

## Quick Start Commands

### 1. Backend Server
```bash
cd backend
npm install
npm run dev
```
Health Check: `http://localhost:5000/api/health`

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Access UI: `http://localhost:5173`

### 3. Test Engine (Playwright)
```bash
cd test-engine
npm install
npx playwright install chromium
npm test
```

### 4. Docker Compose
```bash
docker compose up -d mongodb
# or run entire stack:
docker compose up --build
```
