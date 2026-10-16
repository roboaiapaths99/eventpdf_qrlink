require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dns = require('dns');
const mongoose = require('mongoose');

// Configure reliable DNS servers to prevent querySrv ECONNREFUSED on Windows/ISPs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

// 🛡️ Crash Protection: Prevents unhandled errors from terminating the Node server
process.on('uncaughtException', (err) => {
  console.error('[CRASH PREVENTED] Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[CRASH PREVENTED] Unhandled Rejection:', reason);
});

const app = express();
const PORT = process.env.PORT || 5050;

// Admin Credentials
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'technula@gmail.com').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Technula#191219';
const JWT_SECRET = process.env.JWT_SECRET || 'technula-secret-key-2026-event-robotics';

// MongoDB Configuration (Connected to 'eventkitlead' database)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bhaskarjoshi9965_db_user:Kichcha00@lmsfull.acqnhdd.mongodb.net/eventkitlead?retryWrites=true&w=majority&appName=lmsfull';
let isMongoConnected = false;

// Lead Schema & Model
const leadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  mobile: { type: String, required: true, trim: true },
  className: { type: String, required: true, trim: true },
  school: { type: String, required: true, trim: true },
  registeredAt: { type: Date, default: Date.now },
  downloaded: { type: Boolean, default: false },
  downloadCount: { type: Number, default: 0 },
  lastDownloadedAt: { type: Date },
  clientIp: { type: String }
}, { timestamps: true });

const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

// MongoDB connection event listeners
mongoose.connection.on('connected', () => {
  isMongoConnected = true;
  console.log('🍃 MongoDB connected successfully to database:', mongoose.connection.name);
});
mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
  console.warn('⚠️ MongoDB disconnected. Falling back to local file storage.');
});
mongoose.connection.on('error', (err) => {
  console.error('⚠️ MongoDB connection error:', err.message);
});

// Connect to MongoDB
async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    isMongoConnected = true;
    console.log('🍃 MongoDB Connected Successfully to database:', mongoose.connection.name);
  } catch (err) {
    isMongoConnected = false;
    console.warn('⚠️ MongoDB connection deferred (using persistent file storage fallback):', err.message);
    setTimeout(connectMongoDB, 5000);
  }
}

connectMongoDB();

// Data storage paths (Local JSON persistence & backup)
const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf8');
}

// PDF file location resolution
function resolvePdfPath() {
  const candidates = [
    path.join(__dirname, 'OBSTACLE_AVOINDING_AND_FOLLOWING.pdf'),
    path.join(__dirname, 'OBSTACLE AVOINDING AND FOLLOWING.pdf'),
    path.resolve(__dirname, '..', 'OBSTACLE AVOINDING AND FOLLOWING.pdf'),
    path.resolve(__dirname, '..', 'OBSTACLE_AVOINDING_AND_FOLLOWING.pdf'),
    path.resolve(__dirname, '..', 'frontend', 'OBSTACLE_AVOINDING_AND_FOLLOWING.pdf')
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

const PDF_PATH = resolvePdfPath();

// Helpers: File-based persistence
function getFileLeads() {
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function saveFileLeads(leads) {
  try {
    const tempPath = `${LEADS_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(leads, null, 2), 'utf8');
    fs.renameSync(tempPath, LEADS_FILE);
  } catch (e) {
    console.error('File write error:', e);
  }
}

// Unified Database Access Layer
async function getAllLeads() {
  if (isMongoConnected) {
    try {
      const docs = await Lead.find().sort({ createdAt: -1 }).lean();
      return docs.map(d => ({
        id: d.id,
        name: d.name,
        email: d.email,
        mobile: d.mobile,
        className: d.className,
        school: d.school,
        registeredAt: d.registeredAt ? d.registeredAt.toISOString() : new Date().toISOString(),
        downloaded: d.downloaded,
        downloadCount: d.downloadCount,
        clientIp: d.clientIp
      }));
    } catch (e) {
      console.error('MongoDB query error, falling back to file:', e.message);
    }
  }
  return getFileLeads();
}

async function findLead(leadId) {
  if (!leadId) return null;
  const cleanId = leadId.trim();

  if (isMongoConnected) {
    try {
      const doc = await Lead.findOne({ id: cleanId }).lean();
      if (doc) return doc;
    } catch (e) {}
  }

  const fileLeads = getFileLeads();
  return fileLeads.find(l => l.id === cleanId) || null;
}

async function recordDownload(leadId) {
  if (!leadId) return;
  const cleanId = leadId.trim();

  if (isMongoConnected) {
    try {
      await Lead.updateOne(
        { id: cleanId },
        { 
          $set: { downloaded: true, lastDownloadedAt: new Date() },
          $inc: { downloadCount: 1 }
        }
      );
    } catch (e) {}
  }

  try {
    const fileLeads = getFileLeads();
    const l = fileLeads.find(x => x.id === cleanId);
    if (l) {
      l.downloaded = true;
      l.downloadCount = (l.downloadCount || 0) + 1;
      l.lastDownloadedAt = new Date().toISOString();
      saveFileLeads(fileLeads);
    }
  } catch (e) {}
}

// Token Auth
function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    exp: Date.now() + (24 * 60 * 60 * 1000)
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-admin-token'];
  let token = authHeader;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please login again.' });
  }
  req.admin = payload;
  next();
}

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token', 'Accept']
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Technula Robotics Event API',
    database: isMongoConnected ? 'MongoDB (Connected)' : 'File Storage (Active)',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// 1. Student Registration API
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, mobile, className, school } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Student name is required.' });
    }
    if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }
    const cleanMobile = (mobile || '').toString().replace(/[^0-9]/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number is required.' });
    }
    if (!className || !className.trim()) {
      return res.status(400).json({ success: false, message: 'Class or grade is required.' });
    }
    if (!school || !school.trim()) {
      return res.status(400).json({ success: false, message: 'School or institute name is required.' });
    }

    const leadId = 'TECH-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newLeadData = {
      id: leadId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: cleanMobile.slice(-10),
      className: className.trim(),
      school: school.trim(),
      registeredAt: new Date().toISOString(),
      downloaded: false,
      downloadCount: 0,
      clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
    };

    // 1. Save to MongoDB if connected
    if (isMongoConnected) {
      try {
        await Lead.create({
          ...newLeadData,
          registeredAt: new Date()
        });
      } catch (mErr) {
        console.error('Error writing lead to MongoDB:', mErr.message);
      }
    }

    // 2. Also save to local JSON file
    const fileLeads = getFileLeads();
    fileLeads.unshift(newLeadData);
    saveFileLeads(fileLeads);

    console.log(`[LEAD SAVED] ${newLeadData.name} | ${newLeadData.mobile} | ${newLeadData.school} | DB: ${isMongoConnected ? 'MongoDB' : 'File'}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Robot manual unlocked.',
      leadId: newLeadData.id,
      studentName: newLeadData.name,
      pdfUrl: `/api/pdf/manual?leadId=${newLeadData.id}`
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error processing registration.' });
  }
});

// 2. Serve PDF Manual - STRICTLY PROTECTED (Valid Registration Required)
app.get('/api/pdf/manual', async (req, res) => {
  try {
    if (!fs.existsSync(PDF_PATH)) {
      return res.status(404).json({ success: false, message: 'PDF manual file not found on server.' });
    }

    const { leadId, download } = req.query;

    // 🔒 STRICT CHECK: Must provide a valid registration leadId
    if (!leadId || typeof leadId !== 'string' || !leadId.trim()) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You must fill out the registration form with your details to access this robot manual.'
      });
    }

    const lead = await findLead(leadId);

    // If lead is not found in database, deny access completely
    if (!lead) {
      return res.status(403).json({
        success: false,
        message: 'Invalid Registration: No matching student record found. Please register on the event page.'
      });
    }

    // Record download activity in MongoDB and File
    await recordDownload(leadId);

    const filename = 'OBSTACLE_AVOINDING_AND_FOLLOWING.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    if (download === '1' || download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    }

    const stream = fs.createReadStream(PDF_PATH);
    stream.on('error', (err) => {
      console.error('PDF Stream Error:', err);
      if (!res.headersSent) res.status(500).send('Error streaming PDF file.');
    });
    stream.pipe(res);
  } catch (err) {
    console.error('PDF endpoint error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving PDF manual.' });
  }
});

// 3. Admin Login API
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = generateToken({ email: ADMIN_EMAIL, role: 'admin' });
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: { email: ADMIN_EMAIL }
    });
  }

  return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
});

// 4. Admin Leads List API
app.get('/api/admin/leads', requireAdminAuth, async (req, res) => {
  try {
    const leads = await getAllLeads();
    res.json({
      success: true,
      count: leads.length,
      database: isMongoConnected ? 'MongoDB' : 'File Store',
      leads
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch leads.' });
  }
});

// 5. Admin Dashboard Stats API
app.get('/api/admin/stats', requireAdminAuth, async (req, res) => {
  try {
    const leads = await getAllLeads();
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = leads.filter(l => (l.registeredAt || '').startsWith(today)).length;
    const uniqueSchools = new Set(leads.map(l => (l.school || '').toLowerCase().trim()).filter(Boolean)).size;
    const downloadedCount = leads.filter(l => l.downloaded).length;

    res.json({
      success: true,
      database: isMongoConnected ? 'MongoDB' : 'File Store',
      stats: {
        totalRegistrations: leads.length,
        todayRegistrations: todayCount,
        uniqueSchools,
        downloadedCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// 6. Admin Export Leads to CSV
app.get('/api/admin/export', requireAdminAuth, async (req, res) => {
  try {
    const leads = await getAllLeads();
    const headers = ['Registration ID', 'Date & Time (IST)', 'Student Name', 'Email', 'Mobile', 'Class/Grade', 'School/Institute', 'PDF Downloaded', 'Download Count'];
    
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = leads.map(l => {
      let formattedDate = l.registeredAt;
      try {
        formattedDate = new Date(l.registeredAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      } catch (e) {}

      return [
        escapeCsv(l.id),
        escapeCsv(formattedDate),
        escapeCsv(l.name),
        escapeCsv(l.email),
        escapeCsv(l.mobile),
        escapeCsv(l.className),
        escapeCsv(l.school),
        escapeCsv(l.downloaded ? 'YES' : 'NO'),
        escapeCsv(l.downloadCount || 0)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const filename = `technula_leads_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate CSV export.' });
  }
});

// 7. Delete Lead (Admin)
app.delete('/api/admin/leads/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      try {
        await Lead.deleteOne({ id });
      } catch (e) {}
    }

    let fileLeads = getFileLeads();
    fileLeads = fileLeads.filter(l => l.id !== id);
    saveFileLeads(fileLeads);

    res.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete lead.' });
  }
});

// Serve frontend static files if present
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');
if (fs.existsSync(FRONTEND_DIR)) {
  app.use(express.static(FRONTEND_DIR));

  app.get('/viewer', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'viewer.html'));
  });
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'admin.html'));
  });
  app.get('/sticker', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'sticker.html'));
  });
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🤖 Technula Robotics Event System Server Started!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🍃 Database: MongoDB + Local Backup Active`);
  console.log(`👑 Admin Dashboard: http://localhost:${PORT}/admin.html`);
  console.log(`====================================================`);
});
