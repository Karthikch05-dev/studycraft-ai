import React, { useState } from 'react';
import Roadmap from './Roadmap';
import { getAuth } from 'firebase/auth';

function Dashboard({ user, onLogout }) {
  const [exam, setExam] = useState('');
  const [subjects, setSubjects] = useState('');
  const [hours, setHours] = useState('');
  const [duration, setDuration] = useState('');
  const [level, setLevel] = useState('Easy');
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRoadmap = async () => {
    if (!exam || !subjects || !hours || !duration) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');
    setRoadmap(null);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const idToken = await currentUser.getIdToken();

      const response = await fetch('/roadmap', {
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
      setRoadmap(data.roadmap);
    } catch (error) {
      console.error('Error:', error);
      setError('Unable to generate roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="container">
        <h1>AI Study Roadmap Planner</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>

        <div className="form-section">
          <input
            type="text"
            placeholder="Exam name (e.g. JEE, Semester Exam)"
            value={exam}
            onChange={(e) => setExam(e.target.value)}
          />
          <input
            type="text"
            placeholder="Subjects (comma separated)"
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
          />
          <input
            type="number"
            placeholder="Daily study hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <input
            type="text"
            placeholder="Duration (e.g. 30 days)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <button onClick={generateRoadmap} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Roadmap'}
          </button>
        </div>

        {loading && <p className="loading">AI is planning your study roadmap...</p>}
        {error && <p className="error">{error}</p>}

        {roadmap && <Roadmap roadmapText={roadmap} />}
      </div>
    </div>
  );
}

export default Dashboard;
