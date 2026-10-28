// js/admin-nav.js
// Highlights the active sidebar link and wires up the logout button.
// Runs on every admin page except login.html.

document.addEventListener('DOMContentLoaded', () => {
  requireAdminLogin();

  const admin = getCurrentAdmin();
  const nameEl = document.getElementById('adminName');
  if (nameEl && admin) nameEl.textContent = admin.full_name;

  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      adminLogout();
    });
  }

  // Mark the current page's sidebar link as active
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.admin-sidebar .nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
});
