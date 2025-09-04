export default async function handler(req, res) {
  console.log('🎯 API handler called');
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const { sdp } = req.body;
    
    if (!sdp) {
      throw new Error('No SDP in request body');
    }
    
    console.log('📤 SDP received, length:', sdp.length);
    console.log('📤 SDP preview:', sdp.substring(0, 100));
    
    // The correct endpoint URL format
    const model = req.query.model || 'gpt-4o-mini-realtime-preview-2024-12-17';
    const url = `https://api.openai.com/v1/realtime?model=${model}`;
    
    console.log('🌐 Calling:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/sdp',
        'OpenAI-Beta': 'realtime=v1'
      },
      body: sdp
    });

    const responseText = await response.text();
    
    console.log('📥 OpenAI response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ OpenAI error:', responseText);
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(responseText);
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Raw error:', responseText);
      }
      
      return res.status(response.status).json({ error: responseText });
    }
    
    console.log('✅ Success!');
    res.status(200).json({ sdp: responseText });
    
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ error: error.message });
  }
}