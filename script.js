document.addEventListener('DOMContentLoaded', function() {
  const reportForm = document.getElementById('reportForm');

  if (reportForm) {
    reportForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const clientName = document.getElementById('clientName').value;
      const email = document.getElementById('email').value;
      const language = document.getElementById('language').value;
      const reportLink = document.getElementById('reportLink').value;

      sessionStorage.setItem('clientName', clientName);
      sessionStorage.setItem('email', email);
      sessionStorage.setItem('language', language);
      sessionStorage.setItem('reportLink', reportLink);

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
