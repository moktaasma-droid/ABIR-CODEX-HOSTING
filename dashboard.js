// ===== DASHBOARD LOGIC =====

let currentUser = null;
let pendingFiles = [];
let logInterval = null;
let logRunning = false;

// ===== AUTH GUARD =====
window.addEventListener('DOMContentLoaded', () => {
  const session = sessionStorage.getItem('ac_session');
  if (!session) { window.location.href = 'login.html'; return; }
  currentUser = JSON.parse(session);
  document.getElementById('navUser').textContent = currentUser.username;

  // Restore saved background
  const savedBg = localStorage.getItem('ac_bg_' + currentUser.username) || 'bg-1';
  document.body.className = savedBg;

  loadProjects();
  initConsole();
});

function logout() {
  sessionStorage.removeItem('ac_session');
  window.location.href = 'login.html';
}

// ===== TABS =====
function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.currentTarget.classList.add('active');
}

// ===== BACKGROUND THEME =====
function openBgModal() { document.getElementById('bgModal').style.display = 'flex'; }
function closeBgModal() { document.getElementById('bgModal').style.display = 'none'; }
function setBg(cls) {
  document.body.className = cls;
  if (currentUser) localStorage.setItem('ac_bg_' + currentUser.username, cls);
  closeBgModal();
}

// ===== FILE UPLOAD =====
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropZone').classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
}

function handleFiles(files) {
  for (const file of files) {
    if (!pendingFiles.find(f => f.name === file.name)) {
      pendingFiles.push(file);
    }
  }
  renderFileList();
}

function renderFileList() {
  const list = document.getElementById('fileList');
  const deployBtn = document.getElementById('deployBtn');
  list.innerHTML = '';

  if (pendingFiles.length === 0) { deployBtn.style.display = 'none'; return; }

  pendingFiles.forEach((file, i) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const icons = { html:'🌐', css:'🎨', js:'⚡', py:'🐍', java:'☕', php:'🐘', go:'🔵', cpp:'⚙️', ts:'🔷', json:'📋', md:'📝' };
    const icon = icons[ext] || '📄';
    const size = file.size < 1024 ? file.size + 'B' : file.size < 1048576 ? (file.size/1024).toFixed(1) + 'KB' : (file.size/1048576).toFixed(1) + 'MB';
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `<span class="file-icon">${icon}</span><span class="file-name">${file.name}</span><span class="file-size">${size}</span><button onclick="removeFile(${i})" style="background:none;border:none;color:#ff6b6b;cursor:pointer;font-size:1rem;">✕</button>`;
    list.appendChild(item);
  });

  deployBtn.style.display = 'block';
}

function removeFile(i) {
  pendingFiles.splice(i, 1);
  renderFileList();
}

function deployFiles() {
  if (pendingFiles.length === 0) return;
  // Show ad before deploy
  document.getElementById('deployBtn').style.display = 'none';
  document.getElementById('adBeforeDeploy').style.display = 'block';

  // Auto-log a fake ad view timer for UX
  let t = 5;
  const btn = document.querySelector('#adBeforeDeploy button');
  btn.disabled = true;
  btn.textContent = `⏳ Please wait ${t}s...`;
  const iv = setInterval(() => {
    t--;
    if (t <= 0) {
      clearInterval(iv);
      btn.disabled = false;
      btn.textContent = '✅ Ad Watched — Deploy!';
    } else {
      btn.textContent = `⏳ Please wait ${t}s...`;
    }
  }, 1000);
}

function confirmDeploy() {
  // Create a project entry
  const projectId = 'proj_' + Math.random().toString(36).substr(2, 8);
  const url = `https://abir-codex.vercel.app/p/${projectId}`;

  const projects = getProjects();
  projects.push({
    id: projectId,
    name: pendingFiles[0]?.name.replace(/\.[^.]+$/, '') || 'my-project',
    owner: currentUser.username,
    files: pendingFiles.map(f => ({ name: f.name, size: f.size })),
    url,
    deployed: new Date().toISOString()
  });
  saveProjects(projects);

  // Reset
  pendingFiles = [];
  renderFileList();
  document.getElementById('adBeforeDeploy').style.display = 'none';
  document.getElementById('deployBtn').style.display = 'none';

  // Show success alert + go to projects
  alert(`🎉 Deployed! Your project is live at:\n${url}\n\n(Note: On Vercel free plan, actual file execution needs a backend. This URL is your project ID.)`);

  // Switch to projects tab
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-projects').classList.add('active');
  document.querySelectorAll('.side-btn')[1].classList.add('active');
  loadProjects();
}

// ===== PROJECT STORAGE =====
function getProjects() { return JSON.parse(localStorage.getItem('ac_projects') || '[]'); }
function saveProjects(p) { localStorage.setItem('ac_projects', JSON.stringify(p)); }

function loadProjects() {
  const grid = document.getElementById('projectGrid');
  if (!grid) return;
  const all = getProjects();
  const mine = all.filter(p => p.owner === currentUser.username);

  if (mine.length === 0) {
    grid.innerHTML = '<p class="empty-msg">No projects yet. Upload files to get started!</p>';
    return;
  }

  grid.innerHTML = mine.map(p => `
    <div class="project-card">
      <h4>📦 ${p.name}</h4>
      <p>${p.files ? p.files.length : 1} file(s) · ${new Date(p.deployed).toLocaleDateString()}</p>
      <div class="project-url">${p.url}</div>
      <button class="btn-ghost-sm" onclick="copyUrl('${p.url}')">📋 Copy URL</button>
      <button class="del-btn" onclick="deleteProject('${p.id}')">🗑 Delete</button>
    </div>
  `).join('');
}

function copyUrl(url) {
  navigator.clipboard.writeText(url).then(() => alert('URL copied!'));
}

function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  let projects = getProjects();
  projects = projects.filter(p => p.id !== id);
  saveProjects(projects);
  loadProjects();
}

// ===== TERMINAL =====
const COMMANDS = {
  help: () => `Available commands:\n  ls        List files\n  clear     Clear terminal\n  whoami    Show current user\n  date      Show current date/time\n  echo [x]  Print text\n  pwd       Print working directory`,
  ls: () => `index.html  style.css  script.js  dashboard.js  login.js  admin.js`,
  whoami: () => currentUser?.username || 'guest',
  date: () => new Date().toString(),
  pwd: () => `/home/${currentUser?.username || 'user'}/projects`,
  clear: () => '__CLEAR__'
};

function handleTermKey(e) {
  if (e.key !== 'Enter') return;
  const input = document.getElementById('termInput');
  const output = document.getElementById('termOutput');
  const cmd = input.value.trim();
  input.value = '';

  const line = document.createElement('div');
  line.className = 't-line';
  line.innerHTML = `<span class="c-green">abir-codex@cloud</span>:<span class="c-cyan">~</span>$ ${escHtml(cmd)}`;
  output.appendChild(line);

  if (!cmd) { scrollTerm(); return; }

  const parts = cmd.split(' ');
  const base = parts[0].toLowerCase();

  let result = '';
  if (base === 'echo') {
    result = parts.slice(1).join(' ');
  } else if (COMMANDS[base]) {
    result = COMMANDS[base]();
  } else {
    result = `command not found: ${base}. Type 'help' for commands.`;
  }

  if (result === '__CLEAR__') {
    output.innerHTML = '';
  } else {
    const res = document.createElement('div');
    res.className = 't-line c-gray';
    res.style.whiteSpace = 'pre';
    res.textContent = result;
    output.appendChild(res);
  }
  scrollTerm();
}

function scrollTerm() {
  const output = document.getElementById('termOutput');
  output.scrollTop = output.scrollHeight;
}

// ===== LIVE LOGS =====
const LOG_MESSAGES = [
  { cls: 'log-ok',   text: '[INFO] Server running on port 3000' },
  { cls: 'log-info', text: '[GET] / 200 OK — 12ms' },
  { cls: 'log-info', text: '[GET] /style.css 200 OK — 3ms' },
  { cls: 'log-warn', text: '[WARN] Cache miss for /api/data' },
  { cls: 'log-info', text: '[POST] /upload 200 OK — 45ms' },
  { cls: 'log-ok',   text: '[INFO] File uploaded successfully' },
  { cls: 'log-err',  text: '[ERROR] 404 Not Found: /favicon.ico' },
  { cls: 'log-info', text: '[GET] /dashboard.html 200 OK — 8ms' },
  { cls: 'log-warn', text: '[WARN] High memory usage: 78%' },
  { cls: 'log-ok',   text: '[INFO] Deployment complete: proj_abc123' },
];

function startLogs() {
  const btn = document.getElementById('logToggle');
  const status = document.getElementById('logStatus');

  if (logRunning) {
    clearInterval(logInterval);
    logRunning = false;
    btn.textContent = '▶ Start';
    status.textContent = '● Stopped';
    status.className = 'log-status';
  } else {
    logRunning = true;
    btn.textContent = '⏹ Stop';
    status.textContent = '● Live';
    status.className = 'log-status running';

    function addLog() {
      const win = document.getElementById('logWindow');
      const msg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
      const ts = new Date().toLocaleTimeString();
      const line = document.createElement('div');
      line.className = msg.cls;
      line.textContent = `[${ts}] ${msg.text}`;
      win.appendChild(line);
      win.scrollTop = win.scrollHeight;
    }

    addLog();
    logInterval = setInterval(addLog, 1200 + Math.random() * 800);
  }
}

function clearLogs() {
  document.getElementById('logWindow').innerHTML = '<p class="c-gray">Logs cleared.</p>';
}

// ===== CONSOLE =====
function initConsole() {
  const out = document.getElementById('consoleOutput');
  const line = document.createElement('div');
  line.className = 'c-gray';
  line.textContent = '// Browser JS Console — type any JavaScript expression';
  out.appendChild(line);
}

function handleConsoleKey(e) {
  if (e.key !== 'Enter') return;
  const input = document.getElementById('consoleInput');
  const out = document.getElementById('consoleOutput');
  const code = input.value.trim();
  input.value = '';
  if (!code) return;

  const cmdLine = document.createElement('div');
  cmdLine.style.color = '#ddd';
  cmdLine.textContent = '> ' + code;
  out.appendChild(cmdLine);

  const res = document.createElement('div');
  try {
    // eslint-disable-next-line no-eval
    const result = eval(code);
    res.className = 'c-result';
    res.textContent = '← ' + JSON.stringify(result, null, 2);
  } catch (err) {
    res.className = 'c-error';
    res.textContent = '✗ ' + err.message;
  }
  out.appendChild(res);
  out.scrollTop = out.scrollHeight;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
