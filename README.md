# BloomBot - Mental Health Support Chatbot

BloomBot is an AI-powered mental health support chatbot that provides a safe space for users to discuss their mental health concerns, take mental health assessments, and receive personalized recommendations and resources.

## Features

- 🤖 AI-powered conversational interface
- 🧠 Mental health assessment test
- 📊 Personalized insights and recommendations
- 🔗 Access to mental health resources
- 🔒 Secure and private conversations
- 💬 Natural language understanding

## Tech Stack

- **Frontend:**
  - Next.js
  - React
  - Tailwind CSS
  - OpenAI API

- **Backend:**
  - Python
  - Flask
  - Firebase (Authentication & Database)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- OpenAI API key
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ishanpathak1/BloomBot.git
cd BloomBot
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the frontend directory with:
```
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
BloomBot/
├── frontend/              # Next.js frontend application
│   ├── components/        # React components
│   ├── pages/            # Next.js pages
│   ├── public/           # Static files
│   ├── styles/           # CSS styles
│   └── utils/            # Utility functions
├── app.py                # Python backend server
├── data.csv              # Mental health assessment data
└── embed-csv.js          # Data processing script
```

## Mental Health Assessment

The chatbot includes a comprehensive mental health assessment that:
- Asks personalized questions based on user responses
- Provides immediate feedback and insights
- Offers tailored recommendations
- Connects users with relevant resources

## Security & Privacy

- All conversations are encrypted
- User data is stored securely in Firebase
- No personal information is shared with third parties
- Regular security audits and updates

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for providing the language model
- Firebase for authentication and database services
- Mental health professionals for their guidance and expertise

## Support

For support, email [ishan.pathak2711@gmail.com] or open an issue in the repository.

##Disclaimer

BloomBot is not a replacement for professional mental health services. If you're experiencing a mental health crisis, please contact emergency services or a mental health professional immediately. 