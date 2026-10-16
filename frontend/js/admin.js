// Technula Admin Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const loginAlertBox = document.getElementById('loginAlertBox');
  const loginBtn = document.getElementById('loginBtn');
  const loginBtnText = document.getElementById('loginBtnText');
  const loginSpinner = document.getElementById('loginSpinner');

  const logoutBtn = document.getElementById('logoutBtn');
  const refreshLeadsBtn = document.getElementById('refreshLeadsBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const searchInput = document.getElementById('searchInput');
  const leadsTableBody = document.getElementById('leadsTableBody');
  const leadsCountSummary = document.getElementById('leadsCountSummary');

  // Stats Elements
  const statTotal = document.getElementById('statTotal');
  const statToday = document.getElementById('statToday');
  const statSchools = document.getElementById('statSchools');
  const statDownloads = document.getElementById('statDownloads');

  // QR Modal Elements
  const qrModal = document.getElementById('qrModal');
  const openQrModalBtn = document.getElementById('openQrModalBtn');
  const closeQrModalBtn = document.getElementById('closeQrModalBtn');
  const qrTargetUrl = document.getElementById('qrTargetUrl');
  const qrCodeContainer = document.getElementById('qrCodeContainer');
  const printStickerBtn = document.getElementById('printStickerBtn');
  const downloadQrImgBtn = document.getElementById('downloadQrImgBtn');

  let allLeads = [];
  let qrCodeInstance = null;

  // Check existing session
  const adminToken = sessionStorage.getItem('technula_admin_token');
  if (adminToken) {
    showDashboard();
  } else {
    showLogin();
  }

  function showLogin() {
    loginSection.style.display = 'block';
    dashboardSection.style.display = 'none';
  }

  function showDashboard() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'flex';
    fetchLeads();
  }

  function showLoginAlert(msg, type = 'danger') {
    loginAlertBox.style.display = 'flex';
    loginAlertBox.className = `alert alert-${type}`;
    loginAlertBox.textContent = msg;
  }

  // Pre-fill backend URL input
  const backendUrlInput = document.getElementById('backendUrlInput');
  if (backendUrlInput) {
    backendUrlInput.value = localStorage.getItem('technula_custom_api_url') || '';
  }

  // Handle Login
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginAlertBox.style.display = 'none';

    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    if (backendUrlInput && backendUrlInput.value.trim()) {
      localStorage.setItem('technula_custom_api_url', backendUrlInput.value.trim());
    }

    loginBtn.disabled = true;
    loginSpinner.style.display = 'inline-block';
    loginBtnText.textContent = 'Verifying...';

    const apiBase = getApiBaseUrl();

    try {
      const response = await fetch(`${apiBase}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.setItem('technula_admin_token', data.token);
        sessionStorage.setItem('technula_admin_email', data.admin.email);
        showDashboard();
      } else {
        showLoginAlert(data.message || 'Invalid admin credentials.');
      }
    } catch (err) {
      // Local fallback verification in case API is running separate without proxy
      if (email.toLowerCase() === 'technula@gmail.com' && password === 'Technula#191219') {
        sessionStorage.setItem('technula_admin_token', 'local-bypass-token');
        sessionStorage.setItem('technula_admin_email', email);
        showDashboard();
      } else {
        showLoginAlert('Unable to reach server. Please check your network or credentials.');
      }
    } finally {
      loginBtn.disabled = false;
      loginSpinner.style.display = 'none';
      loginBtnText.textContent = 'Sign In to Dashboard →';
    }
  });

  // Handle Logout
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('technula_admin_token');
    sessionStorage.removeItem('technula_admin_email');
    showLogin();
  });

  // Fetch Leads
  async function fetchLeads() {
    leadsTableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 36px; color: var(--text-muted);">
          <div class="spinner" style="margin: 0 auto 12px; border-color: rgba(37,99,235,0.2); border-top-color: var(--primary);"></div>
          Fetching latest student submissions...
        </td>
      </tr>
    `;

    const token = sessionStorage.getItem('technula_admin_token');
    const apiBase = getApiBaseUrl();

    try {
      const response = await fetch(`${apiBase}/api/admin/leads`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        sessionStorage.removeItem('technula_admin_token');
        showLogin();
        return;
      }

      const data = await response.json();
      if (data.success) {
        allLeads = data.leads || [];
        updateStats();
        renderTable(allLeads);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.warn('Could not fetch live leads:', err);
      // If server is starting up or leads empty
      leadsTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No registrations found yet. Share your kit QR code to get submissions!
          </td>
        </tr>
      `;
      updateStats();
    }
  }

  // Update Stats
  function updateStats() {
    const total = allLeads.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = allLeads.filter(l => (l.registeredAt || '').startsWith(todayStr)).length;
    const schoolsSet = new Set(allLeads.map(l => (l.school || '').toLowerCase().trim()).filter(Boolean));
    const downloadsCount = allLeads.filter(l => l.downloaded).length;

    statTotal.textContent = total;
    statToday.textContent = todayCount;
    statSchools.textContent = schoolsSet.size;
    statDownloads.textContent = downloadsCount;
  }

  // Render Table
  function renderTable(leadsToRender) {
    leadsCountSummary.textContent = `Showing ${leadsToRender.length} of ${allLeads.length} leads`;

    if (!leadsToRender.length) {
      leadsTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No registrations match your search filter.
          </td>
        </tr>
      `;
      return;
    }

    leadsTableBody.innerHTML = leadsToRender.map((lead, index) => {
      let formattedDate = lead.registeredAt || 'N/A';
      try {
        formattedDate = new Date(lead.registeredAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } catch (e) {}

      const cleanPhone = (lead.mobile || '').replace(/[^0-9]/g, '').slice(-10);
      const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent('Hello ' + lead.name + ', greetings from Technula Robotics!')}`;
      const telLink = `tel:${cleanPhone}`;

      return `
        <tr>
          <td style="color: var(--text-light); font-weight: 600;">${index + 1}</td>
          <td style="white-space: nowrap; font-size: 0.85rem;">${formattedDate}</td>
          <td style="font-weight: 700; color: var(--text-main);">${escapeHtml(lead.name)}</td>
          <td>
            <a href="mailto:${escapeHtml(lead.email)}" style="color: var(--primary); text-decoration: none;">
              ${escapeHtml(lead.email)}
            </a>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 600;">${cleanPhone}</span>
              <a href="${waLink}" target="_blank" class="action-icon-btn" title="Chat on WhatsApp" style="color: #25D366;">💬</a>
              <a href="${telLink}" class="action-icon-btn" title="Call Student" style="color: var(--primary);">📞</a>
            </div>
          </td>
          <td><span class="badge badge-muted">${escapeHtml(lead.className || 'N/A')}</span></td>
          <td style="font-weight: 500;">${escapeHtml(lead.school || 'N/A')}</td>
          <td>
            ${lead.downloaded 
              ? `<span class="badge badge-success">✓ Downloaded (${lead.downloadCount || 1})</span>`
              : `<span class="badge badge-muted">Viewed</span>`}
          </td>
          <td>
            <button class="action-icon-btn action-delete-btn" onclick="deleteLead('${lead.id}')" title="Delete lead">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Delete Lead
  window.deleteLead = async function(id) {
    if (!confirm('Are you sure you want to delete this student registration?')) return;

    const token = sessionStorage.getItem('technula_admin_token');
    const apiBase = getApiBaseUrl();

    try {
      const response = await fetch(`${apiBase}/api/admin/leads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        allLeads = allLeads.filter(l => l.id !== id);
        updateStats();
        applyFilter();
      } else {
        alert(data.message || 'Failed to delete lead.');
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  // Search Filter
  searchInput.addEventListener('input', () => {
    applyFilter();
  });

  function applyFilter() {
    const q = searchInput.value.toLowerCase().trim();
    if (!q) {
      renderTable(allLeads);
      return;
    }

    const filtered = allLeads.filter(l => {
      return (
        (l.name || '').toLowerCase().includes(q) ||
        (l.school || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.mobile || '').includes(q) ||
        (l.className || '').toLowerCase().includes(q)
      );
    });

    renderTable(filtered);
  }

  refreshLeadsBtn.addEventListener('click', fetchLeads);

  // Export to CSV
  exportCsvBtn.addEventListener('click', async () => {
    const token = sessionStorage.getItem('technula_admin_token');
    const apiBase = getApiBaseUrl();

    try {
      const response = await fetch(`${apiBase}/api/admin/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `technula_leads_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        exportCsvClientSide();
      }
    } catch (err) {
      exportCsvClientSide();
    }
  });

  // Client-Side CSV Exporter Fallback
  function exportCsvClientSide() {
    if (!allLeads.length) return alert('No registrations to export yet!');
    const headers = ['ID', 'Date & Time', 'Student Name', 'Email', 'Mobile', 'Class', 'School', 'Downloaded'];
    const rows = allLeads.map(l => [
      `"${l.id}"`,
      `"${l.registeredAt}"`,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${l.mobile}"`,
      `"${(l.className || '').replace(/"/g, '""')}"`,
      `"${(l.school || '').replace(/"/g, '""')}"`,
      `"${l.downloaded ? 'YES' : 'NO'}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `technula_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // QR Code Modal & Generator
  openQrModalBtn.addEventListener('click', () => {
    // Default to origin registration page
    const registrationUrl = window.location.origin.replace(/\/admin.*$/, '') + '/index.html';
    qrTargetUrl.value = registrationUrl;
    renderQrCode(registrationUrl);
    qrModal.style.display = 'flex';
  });

  closeQrModalBtn.addEventListener('click', () => {
    qrModal.style.display = 'none';
  });

  qrTargetUrl.addEventListener('input', () => {
    const val = qrTargetUrl.value.trim();
    if (val) renderQrCode(val);
  });

  function renderQrCode(url) {
    qrCodeContainer.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      qrCodeInstance = new QRCode(qrCodeContainer, {
        text: url,
        width: 180,
        height: 180,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      // Fallback Google Chart QR API
      const img = document.createElement('img');
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
      img.alt = 'Technula Kit QR Code';
      img.style.width = '180px';
      img.style.height = '180px';
      qrCodeContainer.appendChild(img);
    }
  }

  printStickerBtn.addEventListener('click', () => {
    window.print();
  });

  downloadQrImgBtn.addEventListener('click', () => {
    const img = qrCodeContainer.querySelector('img');
    const canvas = qrCodeContainer.querySelector('canvas');
    let dataUrl = '';
    if (canvas) {
      dataUrl = canvas.toDataURL('image/png');
    } else if (img) {
      dataUrl = img.src;
    }

    if (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'technula_robot_kit_qr.png';
      a.click();
    } else {
      alert('QR code image generating, please wait a second.');
    }
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});
