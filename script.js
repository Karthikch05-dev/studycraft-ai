import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

async function generateRoadmap() {
  const exam = document.getElementById('exam').value.trim();
  const subjects = document.getElementById('subjects').value.trim();
  const hours = document.getElementById('hours').value.trim();
  const duration = document.getElementById('duration').value.trim();
  const level = document.getElementById('level').value;

  const loadingEl = document.getElementById('loading');
  const resultEl = document.getElementById('result');

  // Validation
  if (!exam || !subjects || !hours || !duration) {
    alert('Please fill all fields');
    return;
  }

  // UI state
  loadingEl.innerText = 'AI is planning your study roadmap...';
  resultEl.innerHTML = '';
  resultEl.classList.remove('show');

  try {
    // Get Firebase ID token
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    const idToken = await user.getIdToken();

    // Call backend
    const response = await fetch('http://localhost:3001/roadmap', {
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

    // Parse roadmap text to HTML table
    const tableHTML = parseRoadmapToTable(roadmapText);

    // Show result
    loadingEl.innerText = '';
    resultEl.innerHTML = tableHTML;
    resultEl.classList.add('show');

  } catch (error) {
    console.error('Error:', error);
    loadingEl.innerText = '';
    resultEl.innerHTML = '<p>⚠️ Unable to generate roadmap. Please try again.</p>';
    resultEl.classList.add('show');
  }
}

function parseRoadmapToTable(text) {
  // Simple parser for AI-generated table text
  const lines = text.split('\n').filter(line => line.trim());
  let table = '<table class="roadmap-table"><thead><tr><th>Day</th><th>Topics</th><th>Task</th></tr></thead><tbody>';

  for (const line of lines) {
    // Assume format like "Day 1 | Topic | Task" or similar
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 3) {
      table += `<tr><td>${parts[0]}</td><td>${parts[1]}</td><td>${parts[2]}</td></tr>`;
    } else if (line.includes('Day')) {
      // Fallback parsing
      const dayMatch = line.match(/Day (\d+)/);
      if (dayMatch) {
        const day = dayMatch[1];
        const rest = line.replace(/Day \d+[:\-]?\s*/, '');
        table += `<tr><td>Day ${day}</td><td>${rest}</td><td>Study</td></tr>`;
      }
    }
  }

  table += '</tbody></table>';
  return table;
}

// Theme Toggle Functionality
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle.querySelector('.theme-icon');

  // Check for saved theme preference or default to dark mode
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  // Toggle theme on button click
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
});
