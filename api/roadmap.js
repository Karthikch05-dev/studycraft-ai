export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { exam, subjects, hours, duration, level } = req.body || {};

    console.log('Received:', { exam, subjects, hours, duration, level });

    if (!exam || !subjects || !hours || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('No API key found');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const prompt = `Create a ${duration}-day study roadmap for ${exam} exam.
Subjects: ${subjects}
Daily study hours: ${hours}
Difficulty level: ${level}

Format EACH line exactly as: Day X | Topic | Task
Generate the complete ${duration}-day roadmap:`;

    console.log('Calling OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a study planning expert. Format: Day X | Topic | Task' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    const responseText = await response.text();
    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response:', responseText);

    if (!response.ok) {
      return res.status(500).json({ error: `OpenAI error: ${response.status}`, details: responseText });
    }

    const data = JSON.parse(responseText);
    return res.status(200).json({ roadmap: data.choices[0]?.message?.content || 'No roadmap' });

  } catch (error) {
    console.error('Server error:', error.message);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
