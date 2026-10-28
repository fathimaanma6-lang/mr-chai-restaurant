// js/api.js
// Small fetch wrapper so every page doesn't repeat the same boilerplate:
// - automatically attaches the customer JWT if one is stored
// - automatically parses JSON
// - throws a readable error message on failure

/**
 * Call the backend API.
 * @param {string} endpoint - e.g. '/foods' or '/auth/login'
 * @param {object} options - { method, body, auth, isFormData }
 */
async function apiRequest(endpoint, options = {}) {
  const { method = 'GET', body = null, auth = false, isFormData = false } = options;

  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = localStorage.getItem('chai_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = { method, headers };
  if (body) {
    fetchOptions.body = isFormData ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
  } catch (networkErr) {
    throw new Error('Could not reach the server. Is the backend running on http://localhost:5000?');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = { success: false, message: 'Unexpected server response.' };
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

// ---------------------------------------------------------------
// Toast notifications (small popup messages, bottom-right)
// ---------------------------------------------------------------
function showToast(message, type = 'default') {
  const existing = document.querySelector('.chai-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `chai-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Force reflow so the transition triggers
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ---------------------------------------------------------------
// Auth helpers (customer)
// ---------------------------------------------------------------
function isLoggedIn() {
  return !!localStorage.getItem('chai_token');
}

function getCurrentUser() {
  const raw = localStorage.getItem('chai_user');
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem('chai_token');
  localStorage.removeItem('chai_user');
  window.location.href = 'login.html';
}

function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

// ---------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------
function formatPrice(amount) {
  return `Rs. ${Number(amount).toLocaleString('en-LK', { maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
