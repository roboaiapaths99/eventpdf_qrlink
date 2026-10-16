# 🤖 Technula Robotics Event Registration & Manual Delivery System

A complete, production-ready system tailored for Technula Robotics events and workshop kits.

---

## 🌟 How the System Works

1. **Kit QR Code & Sticker:**
   - Every robotics kit has a QR sticker that students scan using their smartphones.
2. **Student Registration Page (`/` or `index.html`):**
   - Clean, modern light-theme form asking for:
     - Full Name
     - Email
     - Mobile Number (10 digits)
     - Class / Grade
     - School / Institute Name
   - Clear query card at the bottom:
     - **For more queries contact info@technula.com and mobile number 9990911093** (with tap-to-email and tap-to-call).
3. **Instant PDF Delivery (`/viewer` or `viewer.html`):**
   - Directly presents `OBSTACLE AVOINDING AND FOLLOWING.pdf`.
   - In-browser interactive viewer + 1-click **Download PDF** button.
4. **Admin Dashboard (`/admin` or `admin.html`):**
   - Login Credentials:
     - **Email:** `technula@gmail.com`
     - **Password:** `Technula#191219`
   - Real-time submissions table with search & filter.
   - Click-to-WhatsApp and Click-to-Call buttons for each registered student.
   - **One-click Export to CSV / Excel**.
   - **Built-in Kit QR Code & Printable Sticker Generator**.

---

## 📂 Project Structure

```
url-pdf/
├── backend/                  # Production-ready Node.js/Express API (for Hostinger VPS)
│   ├── server.js             # API routes: /api/register, /api/admin/leads, /api/admin/export, /api/pdf/manual
│   ├── package.json          # Express & CORS dependencies
│   ├── ecosystem.config.js   # PM2 configuration for Hostinger VPS
│   ├── .env.example          # Environment variables template
│   ├── README_BACKEND.md     # VPS deployment instructions
│   └── data/                 # Auto-managed persistent leads storage
├── frontend/                 # Production-ready static web app (for Vercel)
│   ├── index.html            # Student registration form
│   ├── viewer.html           # PDF manual viewer & direct download
│   ├── admin.html            # Admin login, leads table, CSV export, QR generator
│   ├── vercel.json           # Vercel deployment & routing config
│   ├── README_VERCEL.md      # Vercel deployment guide
│   ├── css/style.css         # Modern light-theme stylesheet
│   └── js/
│       ├── config.js         # API endpoint & contact configuration
│       ├── app.js            # Registration form validation & submit
│       ├── viewer.js         # PDF load and download controls
│       └── admin.js          # Admin authentication, stats, table search, CSV & QR generator
├── OBSTACLE AVOINDING AND FOLLOWING.pdf # Robot build manual
└── package.json              # Local development launcher
```

---

## 💻 Running Locally (Quick Test)

1. Open terminal in this folder and install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Start the local server:
   ```bash
   npm start
   ```
3. Open your browser:
   - **Student Form:** `http://localhost:5000`
   - **PDF Viewer:** `http://localhost:5000/viewer.html`
   - **Admin Portal:** `http://localhost:5000/admin.html` (Login: `technula@gmail.com` / `Technula#191219`)

---

## 🚀 Production Deployment

### 1. Frontend on Vercel (LIVE)
- **Live Student Registration & Kit Link:** [https://eventpdfqrlink-frontend.vercel.app/](https://eventpdfqrlink-frontend.vercel.app/)
- **Live PDF Viewer:** [https://eventpdfqrlink-frontend.vercel.app/viewer.html](https://eventpdfqrlink-frontend.vercel.app/viewer.html)
- **Live Admin Portal:** [https://eventpdfqrlink-frontend.vercel.app/admin.html](https://eventpdfqrlink-frontend.vercel.app/admin.html)
- **Live Printable Stickers:** [https://eventpdfqrlink-frontend.vercel.app/sticker.html](https://eventpdfqrlink-frontend.vercel.app/sticker.html)

### 2. Backend on Hostinger VPS (LIVE)
- **VPS Public IP:** `88.222.242.111`
- **Backend Port:** `5050`
- **Live Health Endpoint:** `http://88.222.242.111:5050/health`
- **Data File:** `/var/www/eventkitqr/backend/backend/data/leads.json`
- **Process Manager:** PM2 (`pm2 status technula-api`)
