import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================================
   AUTH STATE (SAFE, NON-INTRUSIVE)
================================ */
const auth = getAuth();
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

/* ================================
   ROADMAP GENERATION (LOGIN ONLY)
================================ */
async function generateRoadmap() {
  const exam = document.getElementById('exam')?.value.trim();
  const subjects = document.getElementById('subjects')?.value.trim();
  const hours = document.getElementById('hours')?.value.trim();
  const duration = document.getElementById('duration')?.value.trim();
  const level = document.getElementById('level')?.value;

  const loadingEl = document.getElementById('loading');
  const resultEl = document.getElementById('result');

  if (!exam || !subjects || !hours || !duration) {
    alert('Please fill all fields');
    return;
  }

  // 🔐 Login required ONLY here
  if (!currentUser) {
    alert("Please login to generate a roadmap.");
    window.location.href = "/login";
    return;
  }

  loadingEl.innerText = 'AI is planning your study roadmap...';
  resultEl.innerHTML = '';
  resultEl.classList.remove('show');

  try {
    const idToken = await currentUser.getIdToken();

    // ⚠️ IMPORTANT:
    // Replace this URL AFTER backend is deployed
    const response = await fetch('/api/roadmap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ exam, subjects, hours, duration, level })
    });

    if (!response.ok) {
      throw new Error('Backend error');
    }

    const data = await response.json();
    const roadmapText = data.roadmap;

    const tableHTML = parseRoadmapToTable(roadmapText);

    loadingEl.innerText = '';
    resultEl.innerHTML = tableHTML;
    resultEl.classList.add('show');

  } catch (error) {
    console.error(error);
    loadingEl.innerText = '';
    resultEl.innerHTML = '<p>⚠️ Unable to generate roadmap. Please try again.</p>';
    resultEl.classList.add('show');
  }
}

/* ================================
   ROADMAP TABLE PARSER
================================ */
function parseRoadmapToTable(text) {
  const lines = text.split('\n').filter(line => line.trim());
  let table = `
    <table class="roadmap-table">
      <thead>
        <tr>
          <th>Day</th>
          <th>Topics</th>
          <th>Task</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const line of lines) {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 3) {
      table += `<tr><td>${parts[0]}</td><td>${parts[1]}</td><td>${parts[2]}</td></tr>`;
    }
  }

  table += '</tbody></table>';
  return table;
}

/* ================================
   THEME TOGGLE (UNCHANGED)
================================ */
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const themeIcon = themeToggle.querySelector('.theme-icon');
  const currentTheme = localStorage.getItem('theme') || 'dark';

  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
});
