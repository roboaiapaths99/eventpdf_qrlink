// Technula PDF Viewer & Download Handler - Strictly Protected
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = (urlParams.get('leadId') || localStorage.getItem('technula_lead_id') || '').trim();
  const studentName = localStorage.getItem('technula_student_name');

  // 🔒 STRICT SECURITY GATE: Block access if student has NOT registered
  if (!leadId) {
    alert('Access Denied: You must fill out the registration form with your details to access this robot manual.');
    window.location.replace('index.html');
    return;
  }

  const welcomeText = document.getElementById('welcomeText');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const openNewTabBtn = document.getElementById('openNewTabBtn');
  const pdfIframe = document.getElementById('pdfIframe');
  const pdfLoadingIndicator = document.getElementById('pdfLoadingIndicator');
  const mobileFallbackCard = document.getElementById('mobileFallbackCard');
  const mobileDirectDownload = document.getElementById('mobileDirectDownload');

  if (studentName) {
    welcomeText.textContent = `Welcome, ${studentName}! Ready to Build 🚀`;
  }

  const apiBase = getApiBaseUrl();
  
  // PDF source URLs strictly require leadId parameter
  const viewUrl = `${apiBase}/api/pdf/manual?leadId=${encodeURIComponent(leadId)}`;
  const downloadUrl = `${apiBase}/api/pdf/manual?leadId=${encodeURIComponent(leadId)}&download=1`;

  // Set download button targets
  downloadPdfBtn.href = downloadUrl;
  mobileDirectDownload.href = downloadUrl;

  openNewTabBtn.addEventListener('click', () => {
    window.open(viewUrl, '_blank');
  });

  // Check if mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    mobileFallbackCard.style.display = 'block';
  }

  // Load iframe
  pdfIframe.src = viewUrl;
  pdfIframe.onload = () => {
    pdfLoadingIndicator.style.display = 'none';
    pdfIframe.style.display = 'block';
  };

  // Timeout fallback in case browser doesn't trigger onload on application/pdf
  setTimeout(() => {
    pdfLoadingIndicator.style.display = 'none';
    pdfIframe.style.display = 'block';
  }, 2500);
});
