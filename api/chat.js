const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const key = process.env.ANTHROPIC_KEY;
  const messages = req.body && req.body.messages ? req.body.messages : [];
  const system = req.body && req.body.system ? req.body.system : '';

  const contents = [];
  
  if (system) {
    contents.push({ role: 'user', parts: [{ text: system }] });
    contents.push({ role: 'model', parts: [{ text: 'Entendido. Vou seguir essas instruções.' }] });
  }

  messages.forEach(function(m) {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    });
  });

  const bodyData = JSON.stringify({
    contents: contents,
    generationConfig: { maxOutputTokens: 1000, temperature: 0.9 }
  });

  const path = '/v1beta/models/gemini-1.5-flash:generateContent?key=' + key;

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: path,
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
        const text = parsed.candidates &&
                     parsed.candidates[0] &&
                     parsed.candidates[0].content &&
                     parsed.candidates[0].content.parts &&
                     parsed.candidates[0].content.parts[0] &&
                     parsed.candidates[0].content.parts[0].text
                     ? parsed.candidates[0].content.parts[0].text
                     : 'Não consegui processar. Tente novamente.';
        res.status(200).json({ content: [{ type: 'text', text: text }] });
      } catch(e) {
        res.status(200).json({ content: [{ type: 'text', text: 'Erro: ' + data }] });
      }
    });
  });

  apiReq.on('error', (e) => {
    res.status(200).json({ content: [{ type: 'text', text: 'Erro conexao: ' + e.message }] });
  });

  apiReq.write(bodyData);
  apiReq.end();
};
