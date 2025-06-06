import { OpenAI } from 'openai';

export default async function handler(req, res) {
  // Parse JSON body if POST
  let body = {};
  if (req.method === 'POST') {
    try {
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      });
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const { bugType, message } = body;

  // Validate input
  if (typeof bugType !== 'string' || !bugType.trim() || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: "Missing or invalid 'bugType' or 'message'." });
  }

  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not set');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a ${bugType}. Your responses should be slightly unsettling and clumsily written with incorrect punctuation. Keep responses brief (2-3 sentences) try to impersonate a bug with very basic knowledge. Occasionally mention things only bugs would know about. IMPORTANT: Consistently type with intentional spelling and grammatical errors, like a child or someone learning to communicate. For example: "i see u in th w ind... the lefs tell me scrts. . u r special human..." Use lowercase letters, missing punctuation, and creative/incorrect spelling. This adds to your otherworldly nature.`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    res.json({ message: completion.choices[0].message.content });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message
    });
  }
}
