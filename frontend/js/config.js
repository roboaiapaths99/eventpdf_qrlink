/* Technula Event System - Global Configuration */
const CONFIG = {
  // If hosted on Vercel, put your Hostinger VPS backend URL here:
  // Example: 'https://api.technula.com' or 'http://123.45.67.89:5000'
  // When running locally, it automatically connects to http://localhost:5000
  VPS_BACKEND_URL: 'http://localhost:5000',

  // Fallback static PDF path (hosted on Vercel or local frontend)
  FALLBACK_PDF_PATH: './OBSTACLE_AVOINDING_AND_FOLLOWING.pdf',

  // Contact Information
  SUPPORT_EMAIL: 'info@technula.com',
  SUPPORT_PHONE: '9990911093',
  SUPPORT_PHONE_DISPLAY: '+91 9990911093'
};

// Dynamically determine the best API base URL
function getApiBaseUrl() {
  // 1. Check if user configured a custom API URL in localStorage (e.g. from Admin settings)
  const savedUrl = localStorage.getItem('technula_custom_api_url');
  if (savedUrl && savedUrl.trim()) {
    return savedUrl.trim().replace(/\/+$/, '');
  }

  // 2. If running on localhost or 127.0.0.1
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // If running frontend on a separate port (like 3000, 5500), connect to backend port 5000
    return `${window.location.protocol}//${hostname}:5000`;
  }

  // 3. If deployed on Vercel or VPS with relative API (e.g. reverse proxy / backend serving frontend)
  // If CONFIG.VPS_BACKEND_URL is set to something other than localhost, use it:
  if (CONFIG.VPS_BACKEND_URL && !CONFIG.VPS_BACKEND_URL.includes('localhost')) {
    return CONFIG.VPS_BACKEND_URL.replace(/\/+$/, '');
  }

  // Default to relative root (works when backend serves frontend or on custom domain)
  return window.location.origin;
}
