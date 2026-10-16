# Technula Frontend - Vercel Deployment Guide

This frontend is a production-ready, ultra-lightweight client for the Technula Robotics Event Registration and Manual Access system.

---

## ⚡ Option 1: Deploy with Vercel CLI (Fastest)

1. Open terminal in the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install & Run Vercel:
   ```bash
   npx vercel
   ```
3. Follow the quick prompts (select "Yes", root directory `./`, and deploy).

---

## 🌐 Option 2: Deploy via GitHub & Vercel Dashboard

1. Push your project or the `frontend` folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Click **Deploy**.

---

## 🔗 Connecting to your Hostinger VPS Backend

By default, the frontend connects to `http://localhost:5000` during local testing. 

When your Hostinger VPS backend is live (e.g. `https://api.technula.com` or `http://YOUR_VPS_IP:5000`), update `frontend/js/config.js`:

```javascript
const CONFIG = {
  VPS_BACKEND_URL: 'https://api.technula.com', // Replace with your live VPS URL
  ...
};
```
And redeploy to Vercel (or push to git).

---

## 📱 Kit QR Stickers
Once your Vercel site is deployed:
1. Open `https://your-app.vercel.app/admin.html`
2. Sign in with:
   - Email: `technula@gmail.com`
   - Password: `Technula#191219`
3. Click **"🏷️ Generate Kit QR Code"**.
4. Enter your live Vercel URL $\rightarrow$ Click **"Print Sticker"** or **"Download QR"** $\rightarrow$ Paste the stickers on your robotics kit boxes!
