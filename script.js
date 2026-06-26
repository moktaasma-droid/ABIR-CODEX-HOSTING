// ===== HOME PAGE ANIMATIONS =====

// Animated counters
function animateCounter(id, target, duration = 2000) {
  const el = document.getElementById(id);
  if (!el) return;
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target.toLocaleString(); clearInterval(timer); }
    else el.textContent = Math.floor(start).toLocaleString();
  }, 16);
}

// Load stats from localStorage (shared with admin)
window.addEventListener('DOMContentLoaded', () => {
  const users = JSON.parse(localStorage.getItem('ac_users') || '[]');
  const projects = JSON.parse(localStorage.getItem('ac_projects') || '[]');
  animateCounter('statUsers', users.length || 1);
  animateCounter('statFiles', projects.reduce((sum, p) => sum + (p.files ? p.files.length : 1), 0) || 0);
});
