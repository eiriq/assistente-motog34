export default async function handler(req, res) {
  // Configurar CORS para permitir requisições do seu frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Responder OPTIONS para preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Pegar as chaves das variáveis de ambiente
  const keys = [
    process.env.HF_API_KEY_1,
    process.env.HF_API_KEY_2
  ].filter(Boolean);
  
  let currentKeyIndex = 0;

  try {
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keys[currentKeyIndex]}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      // Se der erro de rate limit, tenta a próxima chave
      if (response.status === 429 && keys.length > 1) {
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        const retryResponse = await fetch('https://router.huggingface.co/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${keys[currentKeyIndex]}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(req.body)
        });
        const retryData = await retryResponse.json();
        return res.status(retryResponse.status).json(retryData);
      }
      
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({ 
      error: 'Erro ao processar requisição',
      details: error.message 
    });
  }
}
