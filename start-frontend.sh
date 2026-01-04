#!/bin/bash

# Script to start the VLESS frontend from the correct directory
echo "🚀 Starting VLESS Config Manager Frontend..."

# Navigate to frontend directory
cd frontend || {
  echo "❌ Error: frontend directory not found!"
  exit 1
}

echo "📁 Changed to: $(pwd)"

# Disable SWC to avoid compilation issues
export NEXT_TELEMETRY_DISABLED=1
export SWC_BINARY_PATH=""

echo "🌐 Starting Next.js development server (SWC disabled)..."

# Start with SWC completely disabled
npm run dev
