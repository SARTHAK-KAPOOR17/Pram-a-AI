#!/bin/bash
# Pramāṇa AI - Local Development Startup Script (Bash)
set -e

echo "=== Starting Pramāṇa AI Development Services ==="
echo "Node: $(node -v)"

# Start backend in background
(cd backend && npm run dev) &
BACKEND_PID=$!

# Start frontend in background
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Services started!"
echo "Backend: http://localhost:5000/api/health (PID: $BACKEND_PID)"
echo "Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"

wait $BACKEND_PID $FRONTEND_PID
