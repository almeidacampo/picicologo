const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const key = process.env.ANTHROPIC_KEY;
  const body = JSON.stringify({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1000,
    system: req.body && req.body.system ? req.body.system : '',
    messages: req.body && req.body.messages ? req.body.messages : []
  });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const apiReq = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => { data += chunk; });
    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        // Se vier erro da Anthropic, transforma em resposta válida
        if (parsed.error) {
          return res.status(200).json({
            content: [{ type: 'text', text: 'Erro API: ' + parsed.error.message }]
          });
        }
        res.status(200).json(parsed);
      } catch(e) {
        res.status(200).json({ content: [{ type: 'text', text: data }] });
      }
    });
  });

  apiReq.on('error', (e) => {
    res.status(200).json({ content: [{ type: 'text', text: 'Erro: ' + e.message }] });
  });

  apiReq.write(body);
  apiReq.end();
};
