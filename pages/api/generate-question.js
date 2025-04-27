import OpenAI from 'openai';

// Log if API key is missing (but don't throw error yet)
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const mockQuestion = {
  question: "How are you feeling today?",
  type: "initial",
  options: [
    { value: "great", text: "Great! 😊" },
    { value: "good", text: "Good 🙂" },
    { value: "okay", text: "Okay 😐" },
    { value: "not_great", text: "Not Great 😔" },
    { value: "bad", text: "Bad 😢" }
  ]
};

export default async function handler(req, res) {
  // Set content type to JSON
  res.setHeader('Content-Type', 'application/json');
  
  console.log('generate-question API called');
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body:', req.body);
    const { conversation = [], currentAnswers = {} } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      // Return a mock response for development
      return res.status(200).json(mockQuestion);
    }

    // Create a prompt for the AI based on the conversation and answers
    const prompt = `Based on the following conversation and answers, generate the next relevant mental health question. 
    The question should be personalized and follow up on previous responses. 
    Keep it conversational and supportive.
    
    Previous conversation:
    ${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
    
    Current answers:
    ${Object.entries(currentAnswers).map(([q, a]) => `Q${q}: ${a.text}`).join('\n')}
    
    Generate a follow-up question and appropriate response options. Format the response as:
    Question: [Your question here]
    Option 1: [First option]
    Option 2: [Second option]
    Option 3: [Third option]
    Option 4: [Fourth option]
    Option 5: [Fifth option]`;

    console.log('Sending prompt to OpenAI:', prompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a compassionate mental health professional conducting a personalized assessment. Generate relevant follow-up questions based on the user's responses. Keep questions supportive and non-judgmental. Always format your response with a question followed by 5 options."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    console.log('OpenAI response:', completion);

    const response = completion.choices[0].message.content;
    console.log('Raw response:', response);
    
    // Parse the AI response to extract question and options
    const lines = response.split('\n').map(line => line.trim()).filter(line => line);
    const question = lines[0].replace('Question:', '').trim();
    const options = lines.slice(1)
      .filter(line => line.toLowerCase().startsWith('option'))
      .map(line => {
        const [_, text] = line.split(':').map(s => s.trim());
        const value = text.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return { value, text };
      });

    console.log('Parsed question:', question);
    console.log('Parsed options:', options);

    if (!question || options.length === 0) {
      console.error('Invalid response format:', { question, options });
      return res.status(200).json(mockQuestion);
    }

    const result = {
      question,
      type: 'follow_up',
      options
    };

    console.log('Returning result:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in generate-question:', error);
    // Return a mock response if there's an error
    res.status(200).json(mockQuestion);
  }
} 