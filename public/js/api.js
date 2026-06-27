// ================================
// API HELPER & GLOBAL UTILITIES
// ================================

const API_BASE = '/api';

// ---- Fetch wrapper ----
async function api(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.message.includes('Authentication required') || error.message.includes('Invalid or expired token')) {
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }
    throw error;
  }
}

// ---- Auth state ----
function getUser() {
  try {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem('user');
}

function isLoggedIn() {
  return !!getUser();
}

function isStaff() {
  const user = getUser();
  return user?.role === 'staff';
}

// ---- Navbar state ----
function updateNavbar() {
  const user = getUser();
  const authLinks = document.querySelectorAll('.nav-auth-hide');
  const staffLinks = document.querySelectorAll('.nav-staff-hide');
  const loginBtn = document.getElementById('navLoginBtn');
  const logoutBtn = document.getElementById('navLogoutBtn');
  const userName = document.getElementById('navUserName');

  if (user) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = '';
    userName.style.display = '';
    userName.textContent = user.name;

    if (user.role === 'customer') {
      authLinks.forEach(el => el.style.display = '');
      staffLinks.forEach(el => el.style.display = 'none');
    } else if (user.role === 'staff') {
      authLinks.forEach(el => el.style.display = 'none');
      staffLinks.forEach(el => el.style.display = '');
    }
  } else {
    loginBtn.style.display = '';
    logoutBtn.style.display = 'none';
    userName.style.display = 'none';
    authLinks.forEach(el => el.style.display = 'none');
    staffLinks.forEach(el => el.style.display = 'none');
  }

  // Highlight current page in nav
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}

async function handleLogout() {
  try {
    await api('/auth/logout', { method: 'POST' });
  } catch (e) { /* ignore */ }
  clearUser();
  window.location.href = '/';
}

// ---- Cart badge ----
async function updateCartBadge() {
  if (!isLoggedIn() || isStaff()) return;

  try {
    const data = await api('/cart');
    const badge = document.getElementById('cartBadge');
    if (badge && data.itemCount > 0) {
      badge.textContent = data.itemCount;
      badge.classList.add('visible');
    } else if (badge) {
      badge.classList.remove('visible');
    }
  } catch {
    // Not logged in or error
  }
}

// ---- Toast notifications ----
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ---- Modal ----
function showModal(content) {
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('modalContent');
  modal.innerHTML = content;
  overlay.classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// ---- Utilities ----
function formatPrice(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getStatusBadge(status) {
  const labels = {
    pending: 'Pending',
    pending_verification: 'Pending Verification',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    pending_cancellation: 'Pending Cancellation',
    cancelled: 'Cancelled',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Require auth - redirect to login if not logged in
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

function requireStaff() {
  if (!isStaff()) {
    window.location.href = '/';
    return false;
  }
  return true;
}
