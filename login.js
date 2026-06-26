// ===== AUTH LOGIC =====

const ADMIN_USER = 'Abir-Codex';
const ADMIN_PASS = 'Abir1234';

function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const title = document.getElementById('formTitle');
  const sub = document.getElementById('formSub');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    title.textContent = 'Welcome Back';
    sub.textContent = 'Sign in to your account';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
    title.textContent = 'Create Account';
    sub.textContent = 'Join Abir-Codex Cloud for free';
  }
}

function togglePass(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

function getUsers() {
  return JSON.parse(localStorage.getItem('ac_users') || '[]');
}
function saveUsers(users) {
  localStorage.setItem('ac_users', JSON.stringify(users));
}

function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginErr');
  errEl.textContent = '';

  if (!username || !password) {
    errEl.textContent = '⚠️ Please fill in all fields.';
    return;
  }

  // Admin check
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    sessionStorage.setItem('ac_admin', 'true');
    window.location.href = 'admin.html';
    return;
  }

  // User check
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    errEl.textContent = '❌ Wrong username or password. Please try again.';
    return;
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  saveUsers(users);

  sessionStorage.setItem('ac_session', JSON.stringify({ username: user.username }));
  window.location.href = 'dashboard.html';
}

function validateUsername(u) {
  // Must end with @
  if (!u.endsWith('@')) return 'Username must end with @ (e.g. john@)';
  if (u.length < 3) return 'Username too short';
  return null;
}

function validatePassword(p) {
  if (p.length < 8) return 'Password must be at least 8 characters';
  return null;
}

function doRegister() {
  const username = document.getElementById('regUser').value.trim();
  const password = document.getElementById('regPass').value;
  const password2 = document.getElementById('regPass2').value;
  const errEl = document.getElementById('regErr');
  const sucEl = document.getElementById('regSuc');
  errEl.textContent = '';
  sucEl.textContent = '';

  const uErr = validateUsername(username);
  if (uErr) { errEl.textContent = '⚠️ ' + uErr; return; }

  const pErr = validatePassword(password);
  if (pErr) { errEl.textContent = '⚠️ ' + pErr; return; }

  if (password !== password2) { errEl.textContent = '⚠️ Passwords do not match.'; return; }

  // Block admin username
  if (username === ADMIN_USER) { errEl.textContent = '❌ This username is reserved.'; return; }

  const users = getUsers();
  if (users.find(u => u.username === username)) {
    errEl.textContent = '❌ Username already taken. Try another.';
    return;
  }

  users.push({
    username,
    password,
    joined: new Date().toISOString(),
    lastLogin: null,
    status: 'active'
  });
  saveUsers(users);

  sucEl.textContent = '✅ Account created! You can now login.';
  setTimeout(() => switchTab('login'), 1500);
}

// Enter key support
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const loginForm = document.getElementById('loginForm');
    if (loginForm && loginForm.style.display !== 'none') doLogin();
    else doRegister();
  }
});
