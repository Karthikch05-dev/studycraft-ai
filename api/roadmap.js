export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { exam, subjects, hours, duration, level } = req.body;

    if (!exam || !subjects || !hours || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    const prompt = `Create a ${duration}-day study roadmap for ${exam} exam.
Subjects: ${subjects}
Daily study hours: ${hours}
Difficulty level: ${level}

Format EACH line exactly as: Day X | Topic | Task
Example:
Day 1 | Physics - Mechanics | Study Newton's Laws, solve 10 problems
Day 2 | Chemistry - Organic | Learn functional groups, practice reactions

Generate the complete ${duration}-day roadmap:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a study planning expert. Format output as: Day X | Topic | Task' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) return res.status(500).json({ error: 'Failed to generate roadmap' });

    const data = await response.json();
    return res.status(200).json({ roadmap: data.choices[0]?.message?.content || 'No roadmap' });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
