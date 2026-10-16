#!/bin/bash
set -e

echo "========================================================"
echo "🤖 Starting Technula EventKitQR VPS Deployment..."
echo "========================================================"

if [ -d "backend" ]; then
  cd backend
fi

# 1. Pull latest code from GitHub
echo "📥 1. Pulling latest code..."
git pull origin main

# 2. Allow port 5050 in firewall if ufw is active
echo "🛡️ 2. Ensuring firewall allows port 5050..."
command -v ufw >/dev/null 2>&1 && ufw allow 5050/tcp 2>/dev/null || true

# 3. Create production .env with MongoDB Atlas eventkitlead URI if not exists
if [ ! -f .env ]; then
  echo "🍃 Setting up .env with MongoDB Atlas connection..."
  cat << 'EOF' > .env
PORT=5050
NODE_ENV=production
ADMIN_EMAIL=technula@gmail.com
ADMIN_PASSWORD=Technula#191219
JWT_SECRET=technula-secret-key-2026-event-robotics
MONGODB_URI=mongodb+srv://bhaskarjoshi9965_db_user:Kichcha00@lmsfull.acqnhdd.mongodb.net/eventkitlead?retryWrites=true&w=majority&appName=lmsfull
EOF
fi

# 4. Install production dependencies (including mongoose & dotenv)
echo "📦 3. Installing production dependencies..."
npm install --production

# 5. Clean up old PM2 processes & free port 5050
echo "🔄 4. Starting PM2 process (eventkitqr-api)..."
pm2 delete eventkitqr-api 2>/dev/null || true
pm2 delete technula-backend 2>/dev/null || true
pm2 delete technula-api 2>/dev/null || true
command -v fuser >/dev/null 2>&1 && fuser -k 5050/tcp 2>/dev/null || true
sleep 1
pm2 start ecosystem.config.js
pm2 save

# 6. Verify backend health
echo ""
echo "🔍 5. Verifying backend health & MongoDB connection..."
sleep 2
HEALTH=$(curl -s http://127.0.0.1:5050/health || echo "FAILED")

if [[ "$HEALTH" == *"MongoDB"* ]] || [[ "$HEALTH" == *"ok"* ]]; then
  echo "✅ Server is HEALTHY and CONNECTED TO MONGODB!"
  echo "Response: $HEALTH"
else
  echo "⚠️ Warning: Health check output: $HEALTH"
fi

# 7. Print VPS Info
VPS_IP=$(curl -s https://ifconfig.me || curl -s https://api.ipify.org || echo "88.222.242.111")

echo ""
echo "========================================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "📡 VPS Public IP:   $VPS_IP"
echo "🌐 API Endpoint:     http://$VPS_IP:5050"
echo "🍃 Database Name:    eventkitlead (MongoDB Atlas)"
echo "========================================================"
