# Pramāṇa AI — Development Environment Setup

This guide walks you through setting up and running Pramāṇa AI on your local workstation.

---

## Prerequisites

- **Node.js**: v18.x or later (v20+ or v24 recommended)
- **npm**: v9.x or later
- **MongoDB**: Local MongoDB instance (default port 27017) or Docker container (optional for Phase 1 basic health check)
- **Docker & Docker Compose** (Optional for containerized development)

---

## 1. Quick Start (Local Workstation)

### Step 1: Clone & Configure Root

```bash
git clone <repository-url>
cd pramana-ai
```

### Step 2: Configure Backend Environment

```bash
cd backend
cp .env.example .env
npm install
```

The default `.env` is pre-configured for local development:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pramana_ai
JWT_SECRET=pramana_super_secure_jwt_development_secret_key_32chars
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```
Verify the health check endpoint:
```bash
curl http://localhost:5000/api/health
```
Response:
```json
{
  "success": true,
  "message": "Pramāṇa AI API is running"
}
```

---

## 2. Frontend Setup

In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```

The frontend will start at [http://localhost:5173](http://localhost:5173).
- **Home / Architecture:** `http://localhost:5173/`
- **Dashboard:** `http://localhost:5173/dashboard`
- **Login:** `http://localhost:5173/login`
- **Register:** `http://localhost:5173/register`

---

## 3. Test Engine Setup (Playwright)

In a separate terminal window:
```bash
cd test-engine
npm install
npx playwright install chromium
```

Run the smoke test:
```bash
npm test
```

Expected output:
```text
Running 1 test using 1 worker
  ✓  tests/smoke.spec.js:10:7 › Pramāṇa AI Engine Smoke Verification › should launch browser and verify DOM execution environment (520ms)

  1 passed (1.2s)
```

---

## 4. Docker Compose Setup (Optional)

To start MongoDB and local services via Docker:
```bash
docker compose up -d mongodb
```
Or to run the full stack:
```bash
docker compose up --build
```
