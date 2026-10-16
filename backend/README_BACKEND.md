# Technula Backend - Hostinger VPS Deployment Guide

This backend is a lightweight Node.js/Express server that stores registrations, streams the PDF manual, handles admin authentication, and exports CSV leads.

---

## 🚀 Quick Setup on Hostinger VPS (Ubuntu / Debian)

### 1. Connect to your VPS via SSH
```bash
ssh root@YOUR_VPS_IP
```

### 2. Install Node.js (v20+ or v22)
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 3. Upload or Clone the Backend
You can upload the `backend/` files and the PDF into a folder named `eventkitqr backend` (or `/var/www/eventkitqr-backend`):
```bash
# Example if cloning repo directly:
git clone https://github.com/roboaiapaths99/eventpdf_qrlink.git "eventkitqr backend"
cd "eventkitqr backend/backend"
```
Or if uploading via Hostinger File Manager into folder `eventkitqr backend`:
```
eventkitqr backend/
├── server.js
├── package.json
├── ecosystem.config.js
├── OBSTACLE_AVOINDING_AND_FOLLOWING.pdf
└── data/
```

### 4. Install Dependencies
```bash
npm install --production
```

### 5. Start with PM2 (Auto-restart on reboot)
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🔒 Optional: Nginx Reverse Proxy & SSL (Recommended)

To bind your custom subdomain (e.g., `api.technula.com`) to the backend with free SSL:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Edit `/etc/nginx/sites-available/technula-api`:
```nginx
server {
    server_name api.technula.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site and get SSL:
```bash
sudo ln -s /etc/nginx/sites-available/technula-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d api.technula.com
```

Now your backend API is live at `https://api.technula.com`!

---

## 👑 Admin Credentials
- **Email:** `technula@gmail.com`
- **Password:** `Technula#191219`
