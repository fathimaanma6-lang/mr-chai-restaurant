// js/admin-api.js
// Fetch wrapper for the admin panel. Uses a SEPARATE token key from the
// customer site (chai_admin_token vs chai_token) so an admin session
// and a customer session can never be mixed up, even in the same browser.

async function adminApiRequest(endpoint, options = {}) {
  const { method = 'GET', body = null, auth = true, isFormData = false } = options;

  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = localStorage.getItem('chai_admin_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = { method, headers };
  if (body) fetchOptions.body = isFormData ? body : JSON.stringify(body);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
  } catch {
    throw new Error('Could not reach the server. Is the backend running on http://localhost:5000?');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = { success: false, message: 'Unexpected server response.' };
  }

  if (response.status === 401 || response.status === 403) {
    // Token missing/expired — send back to admin login
    localStorage.removeItem('chai_admin_token');
    localStorage.removeItem('chai_admin');
    if (!window.location.pathname.endsWith('login.html')) {
      window.location.href = 'login.html';
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function showAdminToast(message, type = 'default') {
  const existing = document.querySelector('.chai-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `chai-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function isAdminLoggedIn() {
  return !!localStorage.getItem('chai_admin_token');
}

function getCurrentAdmin() {
  const raw = localStorage.getItem('chai_admin');
  return raw ? JSON.parse(raw) : null;
}

function adminLogout() {
  localStorage.removeItem('chai_admin_token');
  localStorage.removeItem('chai_admin');
  window.location.href = 'login.html';
}

function requireAdminLogin() {
  if (!isAdminLoggedIn()) {
    window.location.href = 'login.html';
  }
}

function formatPrice(amount) {
  return `Rs. ${Number(amount).toLocaleString('en-LK', { maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
