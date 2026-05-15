document.addEventListener('DOMContentLoaded', function() {
  const reportForm = document.getElementById('reportForm');

  if (reportForm) {
    reportForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const clientName = document.getElementById('clientName').value;
      const language = document.getElementById('language').value;
      const reportLink = document.getElementById('reportLink').value;

      if (!reportLink) {
        alert('Please provide a bioresonance report link.');
        return;
      }

      sessionStorage.setItem('clientName', clientName);
      sessionStorage.setItem('language', language);
      sessionStorage.setItem('reportLink', reportLink || '');

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
