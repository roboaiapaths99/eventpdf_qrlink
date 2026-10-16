// Technula PDF Viewer & Download Handler
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('leadId') || localStorage.getItem('technula_lead_id') || '';
  const studentName = localStorage.getItem('technula_student_name');

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
  
  // PDF source URLs
  let viewUrl = `${apiBase}/api/pdf/manual?leadId=${encodeURIComponent(leadId)}`;
  let downloadUrl = `${apiBase}/api/pdf/manual?leadId=${encodeURIComponent(leadId)}&download=1`;

  // Fallback to static relative file if needed
  if (CONFIG.FALLBACK_PDF_PATH && !apiBase.startsWith('http')) {
    viewUrl = CONFIG.FALLBACK_PDF_PATH;
    downloadUrl = CONFIG.FALLBACK_PDF_PATH;
  }

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
