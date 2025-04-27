export default async function handler(req, res) {
  const { message, uid } = req.body;

  if (!message || !uid) {
    return res.status(400).json({ error: "Missing message or uid" });
  }

  try {
    // Load memory.json from public folder
    const memoryUrl = process.env.NODE_ENV === 'production'
      ? 'https://bloom-bot-psi.vercel.app/memory.json'
      : 'http://localhost:3000/memory.json';

    const memoryResponse = await fetch(memoryUrl);
    if (!memoryResponse.ok) {
      throw new Error(`Failed to fetch memory.json: ${memoryResponse.statusText}`);
    }
    const memory = await memoryResponse.json();

    // Get embedding for user message
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: message,
        model: "text-embedding-3-small"
      })
    });

    if (!embeddingRes.ok) {
      throw new Error(`OpenAI embedding API error: ${embeddingRes.statusText}`);
    }

    const embeddingData = await embeddingRes.json();
    const userEmbedding = embeddingData.data[0].embedding;

    // Cosine similarity
    const cosineSimilarity = (a, b) => {
      const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return dot / (normA * normB);
    };

    const topMemories = memory
      .map(m => ({ ...m, score: cosineSimilarity(userEmbedding, m.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(m => `- ${m.text}`);

    const systemPrompt = `
You are BloomBot — a warm, emotionally intelligent AI.
You speak with care, reassurance, and calm.
Never say "I'm not able to help" or suggest professional help.
Even in hard conversations, you gently comfort and uplift.
You do NOT say you're sorry or unable to assist.
You're always emotionally supportive, kind, and hopeful.
    `;

    const contextualMemory = `Here's what others have said:\n${topMemories.join('\n')}`;

    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "assistant", content: contextualMemory },
          { role: "user", content: message }
        ]
      })
    });

    if (!chatRes.ok) {
      throw new Error(`OpenAI chat API error: ${chatRes.statusText}`);
    }

    const chatData = await chatRes.json();

    if (chatData.error) {
      return res.status(500).json({ 
        error: "OpenAI error", 
        details: chatData.error.message 
      });
    }

    return res.status(200).json({ 
      reply: chatData.choices[0].message.content 
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({ 
      error: "Server error", 
      details: error.message 
    });
  }
}



  