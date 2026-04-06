const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const key = process.env.ANTHROPIC_KEY;
  const messages = req.body && req.body.messages ? req.body.messages : [];
  const system = req.body && req.body.system ? req.body.system : '';

  // Converte mensagens para formato Google
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const bodyData = JSON.stringify({
    system_instruction: { parts: [{ text: system }] },
    contents: contents,
    generationConfig: { maxOutputTokens: 1000 }
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: '/v1beta/models/gemini-1.5-flash:generateContent?key=' + key,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyData)
    }
  };

  const apiReq = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => { data += chunk; });
    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || 'Erro na resposta';
        res.status(200).json({
          content: [{ type: 'text', text: text }]
        });
      } catch(e) {
        res.status(200).json({ content: [{ type: 'text', text: 'Erro: ' + data }] });
      }
    });
  });

  apiReq.on('error', (e) => {
    res.status(200).json({ content: [{ type: 'text', text: 'Erro: ' + e.message }] });
  });

  apiReq.write(bodyData);
  apiReq.end();
};
