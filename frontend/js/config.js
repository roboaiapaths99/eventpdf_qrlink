/* Technula Event System - Global Configuration */
const CONFIG = {
  // If hosted on Vercel, put your Hostinger VPS backend URL here:
  // Example: 'https://api.technula.com' or 'http://123.45.67.89:5000'
  // When running locally, it automatically connects to http://localhost:5000
  VPS_BACKEND_URL: 'http://88.222.242.111:5050',

  // Contact Information
  SUPPORT_EMAIL: 'info@technula.com',
  SUPPORT_PHONE: '9990911093',
  SUPPORT_PHONE_DISPLAY: '+91 9990911093'
};

// Dynamically determine the best API base URL
function getApiBaseUrl() {
  // 1. Check if passed via URL parameter (?api=http://YOUR_VPS_IP:5000)
  try {
    const params = new URLSearchParams(window.location.search);
    const queryApi = params.get('api');
    if (queryApi && queryApi.trim()) {
      const clean = queryApi.trim().replace(/\/+$/, '');
      localStorage.setItem('technula_custom_api_url', clean);
      return clean;
    }
  } catch (e) {}

  // 2. Check if user configured a custom API URL in localStorage (e.g. from Admin settings)
  const savedUrl = localStorage.getItem('technula_custom_api_url');
  if (savedUrl && savedUrl.trim()) {
    return savedUrl.trim().replace(/\/+$/, '');
  }

  // 3. If running locally
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${window.location.protocol}//${hostname}:5050`;
  }

  // 4. In production on Vercel: Use relative path (avoids Mixed Content issues)
  // Vercel reverse proxy forwards all /api/* requests directly to your VPS backend
  return '';
}
