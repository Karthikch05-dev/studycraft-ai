import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import admin from "firebase-admin";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize Firebase Admin SDK (skip if env var not set for testing)
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.log('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not set - Firebase auth disabled for testing');
}

// Middleware to verify Firebase ID token
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Session setup
app.use(session({
  secret: 'studycraft-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Simple in-memory user store (for demo purposes)
const users = [];

// Middleware to check authentication
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Auth routes
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }
  users.push({ username, password });
  req.session.user = username;
  res.json({ message: 'Signup successful', user: username });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.user = username;
  res.json({ message: 'Login successful', user: username });
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logout successful' });
});

app.get('/auth/status', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

// Google OAuth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  (req, res) => {
    // Successful authentication, redirect home
    res.redirect('/');
  }
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/roadmap", verifyToken, async (req, res) => {
  const { exam, subjects, hours, duration, level } = req.body;

  const prompt = `You are an expert study planner.
Create a clear, realistic, day-wise study roadmap.

Exam: ${exam}
Subjects: ${subjects}
Daily study time: ${hours} hours
Duration: ${duration}
Difficulty level: ${level}

Rules:
- Divide subjects evenly
- Include revision days
- Avoid overload
- Simple language
- Table format (Day, Topics, Task)

Return only the roadmap.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    if (data.candidates && data.candidates[0]) {
      res.json({ roadmap: data.candidates[0].content.parts[0].text });
    } else {
      res.status(500).json({ error: "Invalid response from Gemini API" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gemini API failed" });
  }
});

app.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");
});
