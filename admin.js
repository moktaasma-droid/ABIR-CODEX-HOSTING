// ===== ADMIN PANEL LOGIC =====

const ADMIN_USERNAME = 'Abir-Codex';
const ADMIN_PASSWORD = 'Abir1234';

function togglePass(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

function adminLogin() {
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value;
  const err = document.getElementById('adminErr');
  err.textContent = '';

  if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
    sessionStorage.setItem('ac_admin', 'true');
    document.getElementById('adminLoginWrap').style.display = 'none';
    document.getElementById('adminDash').style.display = 'block';
    loadAdminData();
  } else {
    err.textContent = '❌ Wrong admin credentials.';
  }
}

function adminLogout() {
  sessionStorage.removeItem('ac_admin');
  window.location.href = 'index.html';
}

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('ac_admin') === 'true') {
    document.getElementById('adminLoginWrap').style.display = 'none';
    document.getElementById('adminDash').style.display = 'block';
    loadAdminData();
  }

  document.getElementById('adminPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') adminLogin();
  });
});

function getUsers() { return JSON.parse(localStorage.getItem('ac_users') || '[]'); }
function getProjects() { return JSON.parse(localStorage.getItem('ac_projects') || '[]'); }

function loadAdminData() {
  const users = getUsers();
  const projects = getProjects();
  const today = new Date().toDateString();

  document.getElementById('totalUsers').textContent = users.length;
  document.getElementById('activeUsers').textContent = users.filter(u => u.lastLogin && new Date(u.lastLogin).toDateString() === today).length;
  document.getElementById('totalProjects').textContent = projects.length;
  document.getElementById('totalFiles').textContent = projects.reduce((s, p) => s + (p.files ? p.files.length : 1), 0);

  renderUsersTable(users);
  renderProjectsTable(projects);
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTbody');
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#666;">No users registered yet.</td></tr>';
    return;
  }
  const projects = getProjects();
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.username}</td>
      <td>${u.joined ? new Date(u.joined).toLocaleDateString() : 'N/A'}</td>
      <td>${projects.filter(p => p.owner === u.username).length}</td>
      <td><span class="badge-${u.status === 'active' ? 'green' : 'red'}">${u.status || 'active'}</span></td>
      <td><button class="del-btn" onclick="deleteUser('${u.username}')">🗑 Delete</button></td>
    </tr>
  `).join('');
}

function renderProjectsTable(projects) {
  const tbody = document.getElementById('projectsTbody');
  if (projects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#666;">No projects deployed yet.</td></tr>';
    return;
  }
  tbody.innerHTML = projects.map(p => `
    <tr>
      <td style="font-family:'Fira Code',monospace;font-size:0.82rem;">${p.id}</td>
      <td>${p.owner}</td>
      <td>${p.files ? p.files.length : 1}</td>
      <td>${p.deployed ? new Date(p.deployed).toLocaleDateString() : 'N/A'}</td>
      <td><button class="del-btn" onclick="deleteProject('${p.id}')">🗑 Delete</button></td>
    </tr>
  `).join('');
}

let allUsers = [];
function filterUsers() {
  const q = document.getElementById('userSearch').value.toLowerCase();
  const users = getUsers().filter(u => u.username.toLowerCase().includes(q));
  renderUsersTable(users);
}

function deleteUser(username) {
  if (!confirm(`Delete user "${username}" and all their projects?`)) return;
  let users = getUsers().filter(u => u.username !== username);
  localStorage.setItem('ac_users', JSON.stringify(users));
  let projects = getProjects().filter(p => p.owner !== username);
  localStorage.setItem('ac_projects', JSON.stringify(projects));
  loadAdminData();
}

function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  let projects = getProjects().filter(p => p.id !== id);
  localStorage.setItem('ac_projects', JSON.stringify(projects));
  loadAdminData();
}

// ===== ADMIN TABS =====
function adminShowTab(name) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('admin-' + name).classList.add('active');
  event.currentTarget.classList.add('active');
}

// ===== SETTINGS =====
function saveSettings() {
  const settings = {
    maxFileSize: document.getElementById('maxFileSize').value,
    maxProjects: document.getElementById('maxProjects').value,
    maintenance: document.getElementById('maintenanceMode').checked,
    welcomeMsg: document.getElementById('welcomeMsg').value
  };
  localStorage.setItem('ac_settings', JSON.stringify(settings));
  const suc = document.getElementById('settingsSuc');
  suc.textContent = '✅ Settings saved!';
  setTimeout(() => suc.textContent = '', 2000);
}

// Load saved settings
window.addEventListener('DOMContentLoaded', () => {
  const s = JSON.parse(localStorage.getItem('ac_settings') || '{}');
  if (s.maxFileSize) document.getElementById('maxFileSize').value = s.maxFileSize;
  if (s.maxProjects) document.getElementById('maxProjects').value = s.maxProjects;
  if (s.maintenance) document.getElementById('maintenanceMode').checked = s.maintenance;
  if (s.welcomeMsg) document.getElementById('welcomeMsg').value = s.welcomeMsg;
});
