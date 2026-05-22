// Netlify Function to proxy requests to Groq/OpenAI and keep API key secret
const fetch = global.fetch || require('node-fetch');

exports.handler = async function(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};

    const payload = {
      model: body.model || 'llama-3.1-8b-instant',
      messages: body.messages || (body.question ? [{ role: 'user', content: body.question }] : []),
      temperature: typeof body.temperature !== 'undefined' ? body.temperature : 0.7,
      max_tokens: typeof body.max_tokens !== 'undefined' ? body.max_tokens : 1024
    };

    const apiKey = body.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Aucune clé Groq n’est configurée. Ajoute ta clé dans ATHENA et réessaie.' })
      };
    }

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const rawText = await resp.text().catch(() => '');
    let parsedData = {};
    if (rawText) {
      try {
        parsedData = JSON.parse(rawText);
      } catch {
        parsedData = { error: { message: rawText } };
      }
    }

    return {
      statusCode: resp.ok ? 200 : resp.status,
      body: JSON.stringify(parsedData)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
