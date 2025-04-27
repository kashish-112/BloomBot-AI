import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Standard set of mental health resources
const STANDARD_RESOURCES = [
  {
    title: "National Suicide Prevention Lifeline",
    url: "https://988lifeline.org/"
  },
  {
    title: "Crisis Text Line",
    url: "https://www.crisistextline.org/"
  },
  {
    title: "Mental Health America",
    url: "https://www.mhanational.org/"
  },
  {
    title: "NAMI Helpline",
    url: "https://www.nami.org/help"
  },
  {
    title: "Find a Therapist",
    url: "https://www.psychologytoday.com/us/therapists"
  }
];

const mockAnalysis = {
  analysis: "Based on your responses, it seems you're doing well overall.",
  insights: [
    "You appear to be in a positive state of mind",
    "Your responses indicate good emotional well-being"
  ],
  recommendations: [
    "Continue practicing self-care",
    "Maintain your current positive habits"
  ],
  resources: STANDARD_RESOURCES
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, conversation } = req.body;
    console.log('Request body:', { answers, conversation });

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(200).json(mockAnalysis);
    }

    // Create a prompt for the AI to analyze the responses
    const prompt = `Analyze the following mental health assessment conversation and provide personalized insights and recommendations.
    
    Conversation:
    ${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
    
    User's answers:
    ${Object.entries(answers).map(([q, a]) => `Q${q}: ${a.text}`).join('\n')}
    
    Provide your response in the following format:
    
    Analysis:
    [Your analysis here]
    
    Key Insights:
    1. [First insight]
    2. [Second insight]
    3. [Third insight]
    
    Recommendations:
    1. [First recommendation]
    2. [Second recommendation]
    3. [Third recommendation]
    
    Keep the tone supportive and professional.`;

    console.log('Sending prompt to OpenAI:', prompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a compassionate mental health professional analyzing assessment responses. Provide personalized insights and recommendations based on the conversation. Be supportive and professional. Always format your response with clear sections for analysis, insights, and recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    console.log('OpenAI response:', completion);

    const response = completion.choices[0].message.content;
    console.log('Raw response:', response);
    
    // Parse the AI response to extract insights and recommendations
    const sections = response.split('\n\n').map(section => section.trim());
    
    const analysis = sections.find(s => s.toLowerCase().startsWith('analysis:'))
      ?.split('\n').slice(1).join(' ').trim() || mockAnalysis.analysis;
    
    const insights = sections.find(s => s.toLowerCase().startsWith('key insights:'))
      ?.split('\n').slice(1)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean) || mockAnalysis.insights;
    
    const recommendations = sections.find(s => s.toLowerCase().startsWith('recommendations:'))
      ?.split('\n').slice(1)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean) || mockAnalysis.recommendations;

    const result = {
      analysis,
      insights,
      recommendations,
      resources: STANDARD_RESOURCES // Always use the standard resources
    };

    console.log('Returning result:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error analyzing responses:', error);
    res.status(200).json(mockAnalysis);
  }
} 