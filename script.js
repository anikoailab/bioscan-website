document.addEventListener('DOMContentLoaded', function() {
  const reportForm = document.getElementById('reportForm');

  if (reportForm) {
    reportForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const clientName = document.getElementById('clientName').value;
      const language = document.getElementById('language').value;
      const reportLink = document.getElementById('reportLink').value;
      const scanType = document.querySelector('input[name="scanType"]:checked').value;

      if (!reportLink) {
        alert('Please provide a report link.');
        return;
      }

      sessionStorage.setItem('clientName', clientName);
      sessionStorage.setItem('language', language);
      sessionStorage.setItem('reportLink', reportLink || '');
      sessionStorage.setItem('scanType', scanType);

      document.getElementById('loadingScreen').classList.remove('hidden');

      setTimeout(() => {
        window.location.href = 'report.html';
      }, 1500);
    });

    reportForm.reset();
  }

  document.getElementById('demoBtn').addEventListener('click', function() {
    const clientName = document.getElementById('clientName').value || 'Demo Client';
    const language = document.getElementById('language').value || 'en';
    sessionStorage.setItem('clientName', clientName);
    sessionStorage.setItem('language', language);
    sessionStorage.setItem('demoMode', 'true');
    window.location.href = 'report.html';
  });
});

function clearAndReturnHome() {
  sessionStorage.clear();
  window.location.href = '/';
}
