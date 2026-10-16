// Technula Student Registration Handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const alertBox = document.getElementById('alertBox');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  const mobileInput = document.getElementById('studentMobile');

  // Enforce 10 numeric digits only for mobile
  mobileInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
  });

  // Check if student already registered previously in this session/browser
  const existingLeadId = localStorage.getItem('technula_lead_id');
  if (existingLeadId) {
    showAlert('You are already registered! Redirecting to your manual...', 'success');
    setTimeout(() => {
      window.location.href = `viewer.html?leadId=${encodeURIComponent(existingLeadId)}`;
    }, 1200);
  }

  function showAlert(msg, type = 'danger') {
    alertBox.style.display = 'flex';
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = msg;
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideAlert() {
    alertBox.style.display = 'none';
  }

  function setLoading(loading) {
    if (loading) {
      submitBtn.disabled = true;
      btnSpinner.style.display = 'inline-block';
      btnText.textContent = 'Processing Registration...';
    } else {
      submitBtn.disabled = false;
      btnSpinner.style.display = 'none';
      btnText.textContent = 'Unlock Robot Manual & Guide 🚀';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const name = document.getElementById('studentName').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    const mobile = mobileInput.value.trim();
    const className = document.getElementById('studentClass').value;
    const school = document.getElementById('studentSchool').value.trim();

    // Validation
    if (!name) return showAlert('Please enter your full name.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAlert('Please enter a valid email address.');
    if (!mobile || mobile.length < 10) return showAlert('Please enter a valid 10-digit mobile number.');
    if (!className) return showAlert('Please select your class / grade.');
    if (!school) return showAlert('Please enter your school or institute name.');

    setLoading(true);

    const apiBase = getApiBaseUrl();
    const payload = { name, email, mobile, className, school };

    try {
      const response = await fetch(`${apiBase}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save student context locally
        localStorage.setItem('technula_lead_id', data.leadId);
        localStorage.setItem('technula_student_name', data.studentName || name);
        localStorage.setItem('technula_pdf_url', data.pdfUrl || `${apiBase}/api/pdf/manual?leadId=${data.leadId}`);

        showAlert('Registration successful! Opening your robot manual...', 'success');
        setTimeout(() => {
          window.location.href = `viewer.html?leadId=${encodeURIComponent(data.leadId)}`;
        }, 800);
      } else {
        showAlert(data.message || 'Registration failed. Please check your information and try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Registration submission error:', err);
      showAlert('Unable to submit registration to event database. Please check your internet connection and try again.');
      setLoading(false);
    }
  });
});
