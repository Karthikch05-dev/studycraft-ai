import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================================
   FIREBASE CONFIG
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyA-6wm65YIu-EtRC5z1YJ65HT9D418j9lc",
  authDomain: "studycraft-ai-3257a.firebaseapp.com",
  projectId: "studycraft-ai-3257a",
  storageBucket: "studycraft-ai-3257a.firebasestorage.app",
  messagingSenderId: "549698898950",
  appId: "1:549698898950:web:3d1699af5bbcd6e40b0787",
  measurementId: "G-180LBNQQGL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  // Update navbar when auth state changes
  updateAuthLink();
});

/* ================================
   UPDATE NAVBAR AUTH LINK
================================ */
function updateAuthLink() {
  const authLink = document.getElementById('auth-link');
  if (!authLink) return;

  if (currentUser) {
    const displayName = currentUser.displayName || currentUser.email || 'User';
    authLink.innerHTML = `
      <span class="user-name">${displayName.split(' ')[0]}</span>
      <a href="#" onclick="logout()" class="cta-link">Logout</a>
    `;
  } else {
    authLink.innerHTML = `<a href="/login.html" class="cta-link">Login</a>`;
  }
}

/* ================================
   LOGOUT
================================ */
window.logout = async function() {
  try {
    await auth.signOut();
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

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

    const data = await response.json();
    console.log('API Response:', data);

    if (!response.ok) {
      throw new Error(data.error || data.details || 'Backend error');
    }

    const tableHTML = parseRoadmapToTable(data.roadmap);

    loadingEl.innerText = '';
    resultEl.innerHTML = tableHTML;
    resultEl.classList.add('show');

  } catch (error) {
    console.error('Full error:', error);
    loadingEl.innerText = '';
    resultEl.innerHTML = `<p class="error">⚠️ ${error.message}</p>`;
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
