// api/generate.js
// This runs on the server (Vercel), never in the browser — so the API key stays hidden.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { situation, relation, context } = req.body || {};

  if (!context || typeof context !== 'string' || context.trim().length === 0) {
    return res.status(400).json({ error: 'Missing context' });
  }

  // Basic length guard so nobody can send a huge payload and run up your bill
  if (context.length > 1000) {
    return res.status(400).json({ error: 'Context too long' });
  }

  const systemPrompt = `You help people phrase difficult interpersonal messages. Given a situation, a message type, and a relationship, generate exactly 3 distinct ways to phrase the message.

Each of the 3 options must be a genuinely different STRATEGY, not just a reworded version of the same approach. For example: one might soften with warmth and context, one might be brief and direct with minimal justification, one might lead with a concrete proposal or compromise. Vary real tradeoffs, not just tone.

For each option, also assign a tone_position from 0 to 100, where 0 is "as gentle/soft as reasonably possible while still being clear" and 100 is "as direct/blunt as reasonably possible while still being kind". This should reflect where that specific message actually lands.

Respond with ONLY valid JSON, no markdown formatting, no code fences, no preamble. Use exactly this structure:
{
  "options": [
    {
      "label": "a short 2-4 word name for this approach, e.g. 'Warm but firm'",
      "tone_position": 35,
      "message": "the actual message text, written as if the user will copy-paste and send it, appropriately short for the channel implied",
      "rationale": "one sentence, said directly to the user, explaining why this approach might work well for their specific situation"
    }
  ]
}

Write messages that sound like a real person wrote them — natural, not corporate, not overly formal unless the relationship calls for it. Keep each message concise enough to actually send as a text or short message unless the situation clearly calls for something longer.`;

  const userPrompt = `Message type: ${situation || 'Say something difficult'}
Recipient: ${relation || 'this person'}
Situation: ${context}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return res.status(502).json({ error: 'Upstream API error' });
    }

    const data = await response.json();
    const rawText = data.content.map(b => b.text || '').join('\n');
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Something went wrong generating a response' });
  }
}
