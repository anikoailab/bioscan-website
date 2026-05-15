document.addEventListener('DOMContentLoaded', function() {
  const reportForm = document.getElementById('reportForm');

  if (reportForm) {
    reportForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const clientName = document.getElementById('clientName').value;
      const email = document.getElementById('email').value;
      const language = document.getElementById('language').value;
      const reportLink = document.getElementById('reportLink').value;
      const rawReportText = document.getElementById('rawReportText').value;

      // Validate that at least one source is provided
      if (!reportLink && !rawReportText) {
        alert('Please provide either a WebWellness report link or paste the raw report text.');
        return;
      }

      sessionStorage.setItem('clientName', clientName);
      sessionStorage.setItem('email', email);
      sessionStorage.setItem('language', language);
      sessionStorage.setItem('reportLink', reportLink || '');
      sessionStorage.setItem('rawReportText', rawReportText || '');

      document.getElementById('loadingScreen').classList.remove('hidden');

      setTimeout(() => {
        window.location.href = 'report.html';
      }, 1500);
    });

    reportForm.reset();
  }
});

function clearAndReturnHome() {
  sessionStorage.clear();
  window.location.href = '/';
}
