const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'technula@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Technula#191219';
const JWT_SECRET = process.env.JWT_SECRET || 'technula-secret-key-2026-event-robotics';

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
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

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize leads file if not present
if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf8');
}

// Helper: Read leads safely
function getLeads() {
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading leads file:', err);
    return [];
  }
}

// Helper: Save leads safely (atomic write)
function saveLeads(leads) {
  const tempPath = `${LEADS_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(leads, null, 2), 'utf8');
  fs.renameSync(tempPath, LEADS_FILE);
}

// Simple signed token generator and verifier using Node's native crypto
function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
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

// Auth Middleware for Admin Routes
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

// Middleware
app.use(cors({
  origin: true, // Allow all origins (Vercel domain, localhost, etc.)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check (for Hostinger VPS / PM2)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Technula Robotics Event API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// 1. Student Registration API
app.post('/api/register', (req, res) => {
  try {
    const { name, email, mobile, className, school } = req.body;

    // Validation
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

    const leads = getLeads();
    const newLead = {
      id: 'TECH-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
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

    leads.unshift(newLead);
    saveLeads(leads);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Access granted to PDF manual.',
      leadId: newLead.id,
      studentName: newLead.name,
      pdfUrl: `/api/pdf/manual?leadId=${newLead.id}`
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error processing registration.' });
  }
});

// 2. Serve PDF Manual (Inline View or Download)
app.get('/api/pdf/manual', (req, res) => {
  if (!fs.existsSync(PDF_PATH)) {
    return res.status(404).json({ success: false, message: 'PDF manual file not found on server.' });
  }

  // Update lead download status if leadId is passed
  const { leadId, download } = req.query;
  if (leadId) {
    try {
      const leads = getLeads();
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        lead.downloaded = true;
        lead.downloadCount = (lead.downloadCount || 0) + 1;
        lead.lastDownloadedAt = new Date().toISOString();
        saveLeads(leads);
      }
    } catch (e) {
      console.error('Failed to update download stat:', e);
    }
  }

  const filename = 'OBSTACLE_AVOINDING_AND_FOLLOWING.pdf';
  res.setHeader('Content-Type', 'application/pdf');
  if (download === '1' || download === 'true') {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  } else {
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  }

  const stream = fs.createReadStream(PDF_PATH);
  stream.pipe(res);
});

// 3. Admin Login API
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
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
app.get('/api/admin/leads', requireAdminAuth, (req, res) => {
  try {
    const leads = getLeads();
    res.json({
      success: true,
      count: leads.length,
      leads
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch leads.' });
  }
});

// 5. Admin Dashboard Stats API
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  try {
    const leads = getLeads();
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = leads.filter(l => (l.registeredAt || '').startsWith(today)).length;
    const uniqueSchools = new Set(leads.map(l => (l.school || '').toLowerCase().trim())).size;
    const downloadedCount = leads.filter(l => l.downloaded).length;

    res.json({
      success: true,
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
app.get('/api/admin/export', requireAdminAuth, (req, res) => {
  try {
    const leads = getLeads();
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
    console.error('Export error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate CSV export.' });
  }
});

// 7. Delete Lead (Admin)
app.delete('/api/admin/leads/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    let leads = getLeads();
    const initialLen = leads.length;
    leads = leads.filter(l => l.id !== id);

    if (leads.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    saveLeads(leads);
    res.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete lead.' });
  }
});

// Also serve the frontend static files if present (for 1-click local testing or all-in-one VPS deployment)
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');
if (fs.existsSync(FRONTEND_DIR)) {
  app.use(express.static(FRONTEND_DIR));
  
  // Clean fallback routes
  app.get('/viewer', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'viewer.html'));
  });
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'admin.html'));
  });
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🤖 Technula Robotics Event System Server Started!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`👑 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`📄 PDF Manual Source: ${PDF_PATH}`);
  console.log(`====================================================`);
});
