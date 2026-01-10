import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================================
   FIREBASE CONFIG - Replace with your config
================================ */
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

/* ================================
   ROADMAP GENERATION
================================ */
window.generateRoadmap = async function() {
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

  if (!currentUser) {
    alert("Please login to generate a roadmap.");
    window.location.href = "/login.html";
    return;
  }

  loadingEl.innerText = 'AI is planning your study roadmap...';
  resultEl.innerHTML = '';
  resultEl.classList.remove('show');

  try {
    const idToken = await currentUser.getIdToken();

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
    const tableHTML = parseRoadmapToTable(data.roadmap);

    loadingEl.innerText = '';
    resultEl.innerHTML = tableHTML;
    resultEl.classList.add('show');

  } catch (error) {
    console.error(error);
    loadingEl.innerText = '';
    resultEl.innerHTML = '<p class="error">⚠️ Unable to generate roadmap. Please try again.</p>';
    resultEl.classList.add('show');
  }
}

/* ================================
   ROADMAP TABLE PARSER
================================ */
function parseRoadmapToTable(text) {
  const lines = text.split('\n').filter(line => line.trim());
  let table = `<table class="roadmap-table"><thead><tr><th>Day</th><th>Topics</th><th>Task</th></tr></thead><tbody>`;

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
   THEME TOGGLE
================================ */
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const themeIcon = themeToggle.querySelector('.theme-icon');
  const currentTheme = localStorage.getItem('theme') || 'dark';

  document.documentElement.setAttribute('data-theme', currentTheme);
  if (themeIcon) themeIcon.textContent = currentTheme === 'dark' ? '🌙' : '☀️';

  themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    if (themeIcon) themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
  });
});
