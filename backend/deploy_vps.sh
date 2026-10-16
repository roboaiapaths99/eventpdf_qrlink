#!/bin/bash
set -e

echo "========================================================"
echo "🤖 Starting Technula EventKitQR VPS Deployment..."
echo "========================================================"

# 1. Pull latest code from GitHub
echo "📥 1. Pulling latest code..."
git pull origin main

# 2. Install dependencies cleanly
echo "📦 2. Installing production dependencies..."
npm install --production

# 3. Stop any conflicting old instances
echo "🔄 3. Configuring PM2 process..."
pm2 delete technula-api 2>/dev/null || true

# 4. Start backend on Port 5050
pm2 start ecosystem.config.js
pm2 save

# 5. Verify backend is running
echo ""
echo "🔍 4. Verifying backend health..."
HEALTH=$(curl -s http://localhost:5050/health || echo "FAILED")

if [[ "$HEALTH" == *"online"* ]] || [[ "$HEALTH" == *"ok"* ]]; then
  echo "✅ Server is HEALTHY and ONLINE!"
  echo "Response: $HEALTH"
else
  echo "⚠️ Warning: Health check output: $HEALTH"
fi

# 6. Detect and print VPS Public IP
VPS_IP=$(curl -s https://ifconfig.me || curl -s https://api.ipify.org || echo "Could not detect IP")

echo ""
echo "========================================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "📡 Your VPS Public IP: $VPS_IP"
echo "🌐 Backend Endpoint:   http://$VPS_IP:5050"
echo "========================================================"
echo "Copy your VPS IP ($VPS_IP) and enter it in Admin or tell Antigravity to lock it into Vercel!"
echo "========================================================"
