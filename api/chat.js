module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const key = process.env.ANTHROPIC_KEY;
    const messages = req.body.messages || [];
    const system = req.body.system || '';

    const contents = [];
    if (system) {
      contents.push({ role: 'user', parts: [{ text: system }] });
      contents.push({ role: 'model', parts: [{ text: 'Ok, entendido.' }] });
    }
    messages.forEach(m => {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      });
    });

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 1000 } })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      res.status(200).json({ content: [{ type: 'text', text }] });
    } else {
      res.status(200).json({ content: [{ type: 'text', text: JSON.stringify(data) }] });
    }

  } catch(e) {
    res.status(200).json({ content: [{ type: 'text', text: 'Erro: ' + e.message }] });
  }
};
