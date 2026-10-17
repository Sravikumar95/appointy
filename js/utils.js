// ========================================================
// Appointy - Central API & Utility Library
// ========================================================

const BACKEND = (window.location.protocol.startsWith('http') && window.location.port === '4000')
  ? '' 
  : 'http://localhost:4000';

// ── Auth Token Helpers ──
function getToken(role) {
  if (role === 'admin') return localStorage.getItem('aToken');
  if (role === 'doctor') return localStorage.getItem('dToken');
  if (role === 'patient') return localStorage.getItem('pToken');
  return localStorage.getItem('pToken') || localStorage.getItem('dToken') || localStorage.getItem('aToken') || localStorage.getItem('token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || '{}');
  } catch(e) {
    return {};
  }
}

// ── Auth Guards ──
function requireAdmin() {
  const token = localStorage.getItem('aToken');
  if (!token) {
    window.location.href = '/login.html?role=admin';
    return null;
  }
  return token;
}

function requireDoctor() {
  const token = localStorage.getItem('dToken');
  if (!token) {
    window.location.href = '/login.html?role=doctor';
    return null;
  }
  return token;
}

function requirePatient() {
  const token = localStorage.getItem('pToken');
  if (!token) {
    window.location.href = '/login.html?role=patient';
    return null;
  }
  return token;
}

// ── Central API Request Helper ──
async function api(method, path, body = null, tokenOverride = null, isForm = false) {
  const headers = {};
  
  if (!isForm) {
    headers['Content-Type'] = 'application/json';
  }

  // Token resolution
  const aToken = localStorage.getItem('aToken');
  const dToken = localStorage.getItem('dToken');
  const pToken = localStorage.getItem('pToken');

  if (tokenOverride) {
    headers['Authorization'] = `Bearer ${tokenOverride}`;
    headers['aToken'] = tokenOverride;
  } else if (aToken) {
    headers['Authorization'] = `Bearer ${aToken}`;
    headers['aToken'] = aToken;
  } else if (dToken) {
    headers['Authorization'] = `Bearer ${dToken}`;
    headers['dToken'] = dToken;
  } else if (pToken) {
    headers['Authorization'] = `Bearer ${pToken}`;
    headers['pToken'] = pToken;
  }

  const opts = { method, headers };
  if (body) {
    opts.body = isForm ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(BACKEND + path, opts);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, message: 'Cannot connect to server. Ensure backend is running on port 4000.' };
  }
}

// Global alias for compatibility
const apiFetch = api;

// ── Toast Notifications ──
function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast') || document.getElementById('_toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── Logout ──
function logout() {
  localStorage.removeItem('aToken');
  localStorage.removeItem('dToken');
  localStorage.removeItem('pToken');
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  window.location.href = '/login.html';
}

// ── Formatting Utilities ──
function formatDate(dateStr) {
  if (!dateStr) return '—';
  // Handles '2026-10-17' or '17_10_2026'
  if (typeof dateStr === 'string' && dateStr.includes('_')) {
    const parts = dateStr.split('_');
    if (parts.length === 3) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${parts[0]} ${months[parseInt(parts[1])-1]} ${parts[2]}`;
    }
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch (e) {}
  return dateStr;
}

function formatFee(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

function calcAge(dob) {
  if (!dob || dob === 'Not Selected') return '—';
  const birth = new Date(dob);
  const age = Math.floor((Date.now() - birth) / (365.25 * 24 * 60 * 60 * 1000));
  return isNaN(age) ? '—' : age;
}
