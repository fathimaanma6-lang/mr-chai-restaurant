// js/nav.js
// Runs on every customer page to keep the navbar in sync:
// - shows Login/Register or the user's name + Logout depending on auth state
// - updates the cart item-count badge

async function refreshNavCartCount() {
  const badge = document.getElementById('navCartBadge');
  if (!badge) return;

  if (!isLoggedIn()) {
    badge.style.display = 'none';
    return;
  }

  try {
    const data = await apiRequest('/cart', { auth: true });
    const count = data.items.reduce((sum, item) => sum + item.quantity, 0);
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  } catch {
    badge.style.display = 'none';
  }
}

function renderNavAuthState() {
  const authArea = document.getElementById('navAuthArea');
  if (!authArea) return;

  if (isLoggedIn()) {
    const user = getCurrentUser();
    authArea.innerHTML = `
      <li class="nav-item"><a class="nav-link" href="orders.html">My Orders</a></li>
      <li class="nav-item"><a class="nav-link" href="profile.html">${user?.full_name?.split(' ')[0] || 'Profile'}</a></li>
      <li class="nav-item"><a class="nav-link" href="#" id="navLogoutBtn">Logout</a></li>
    `;
    document.getElementById('navLogoutBtn').addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  } else {
    authArea.innerHTML = `
      <li class="nav-item"><a class="nav-link" href="login.html">Login</a></li>
      <li class="nav-item"><a class="nav-link" href="register.html">Register</a></li>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavAuthState();
  refreshNavCartCount();
});
