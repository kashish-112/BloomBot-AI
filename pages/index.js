import { useEffect, useState, useRef } from 'react';
import { auth, db, signOut, getRedirectResult } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import MentalHealthTest from '../components/MentalHealthTest';
import LoginButton from '../components/LoginButton';
import UserOnboarding from '../components/UserOnboarding';

export default function Home() {
  const [user, setUser] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // We handle redirect in the LoginButton component
    // Just check for auth state changes here
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      setAuthLoading(false);
      
      if (u) {
        try {
          // Check if user has completed onboarding
          const userDocRef = doc(db, 'users', u.uid);
          const userDoc = await getDoc(userDocRef);
          
          // If user document doesn't exist or there was a permission error, show onboarding
          if (!userDoc.exists()) {
            setShowOnboarding(true);
            setUserDataLoaded(true);
          } else {
            const userData = userDoc.data();
            
            if (!userData || !userData.onboardingCompleted) {
              setShowOnboarding(true);
            } else {
              setShowOnboarding(false);
              // Load chat messages
              try {
                const q = query(collection(db, 'chats', u.uid, 'messages'), orderBy('timestamp'));
                const snapshot = await getDocs(q);
                setMessages(snapshot.docs.map(doc => doc.data()));
              } catch (chatError) {
                // Continue even if we can't load messages
              }
            }
            setUserDataLoaded(true);
          }
        } catch (error) {
          // If we encounter a permission error, most likely the user is new
          if (error.code === 'permission-denied') {
            setShowOnboarding(true);
          } else {
            // For other errors, show an error message
            alert("Error loading your profile. Please try again or refresh the page.");
          }
          
          setUserDataLoaded(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const content = input.trim();

    // Save user's message in Firestore
    const userMessage = {
      role: 'user',
      content,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, 'chats', user.uid, 'messages'), userMessage);
    setMessages(prev => [...prev, { role: 'user', content, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      // Send to backend to generate response with memory
      const res = await fetch("/api/chat", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, uid: user.uid })
      });

      const data = await res.json();
      const botMessage = {
        role: 'bot',
        content: data.reply,
        timestamp: serverTimestamp()
      };

      // Save bot response
      await addDoc(collection(db, 'chats', user.uid, 'messages'), botMessage);
      setMessages(prev => [...prev, { role: 'bot', content: data.reply, timestamp: new Date() }]);
    } catch (error) {
      console.error("❌ Error fetching BloomBot reply:", error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "Oops! BloomBot couldn't respond right now. Please try again later."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleTestComplete = async (results) => {
    setShowTest(false);
    
    // Create a formatted message with the test results
    const resultsMessage = `
🎯 Mental Health Assessment Results

📊 Analysis:
${results.analysis}

💡 Key Insights:
${results.insights.map(insight => `• ${insight}`).join('\n')}

✨ Recommendations:
${results.recommendations.map(rec => `• ${rec}`).join('\n')}

🔗 Helpful Resources:
${results.resources.map(res => `• ${res.title}: ${res.url}`).join('\n')}
    `.trim();

    // Save the results to Firestore
    if (user) {
      const resultsDoc = {
        role: 'bot',
        content: resultsMessage,
        timestamp: serverTimestamp(),
        type: 'assessment_results'
      };

      await addDoc(collection(db, 'chats', user.uid, 'messages'), resultsDoc);
    }

    // Add the results to the messages state
    setMessages(prev => [...prev, {
      role: 'bot',
      content: resultsMessage,
      timestamp: new Date()
    }]);
  };

  const handleOnboardingComplete = async (welcomeMessage) => {
    setShowOnboarding(false);
    
    // Add welcome message to chat
    const botMessage = {
      role: 'bot',
      content: welcomeMessage,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, 'chats', user.uid, 'messages'), botMessage);
    setMessages([{ 
      role: 'bot', 
      content: welcomeMessage, 
      timestamp: new Date() 
    }]);
  };

  if (authLoading) {
    return (
      <div className="homepage loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading BloomBot...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="homepage">
        <div className="hero-section">
          <h1 className="hero-title">Welcome to BloomBot 🌸</h1>
          <p className="hero-subtitle">Your AI companion for mental wellness and personal growth</p>
          
          <div className="mental-health-highlights">
            <div className="highlight-card">
              <h3>24/7 Support</h3>
              <p>Always here to listen and provide guidance whenever you need it</p>
            </div>
            <div className="highlight-card">
              <h3>Safe Space</h3>
              <p>A judgment-free zone where you can express yourself freely</p>
            </div>
            <div className="highlight-card">
              <h3>Personal Growth</h3>
              <p>Tools and insights to help you grow and maintain mental wellness</p>
            </div>
          </div>

          <div className="login-section">
            <h2 className="login-title">Begin Your Wellness Journey</h2>
            <p className="login-subtitle">Join our community of individuals committed to mental wellness and personal growth</p>
            
            <LoginButton />

            <div className="login-features">
              <div className="login-feature">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Secure and confidential conversations
              </div>
              <div className="login-feature">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                End-to-end encrypted messaging
              </div>
              <div className="login-feature">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Available whenever you need support
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userDataLoaded) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (showOnboarding) {
    return <UserOnboarding user={user} onComplete={handleOnboardingComplete} />;
  }

  if (showTest) {
    return (
      <div className="test-container">
        <MentalHealthTest onComplete={handleTestComplete} />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div className="header-buttons">
          <button className="test-button" onClick={() => setShowTest(true)}>
            Take Mental Health Assessment
          </button>
          <button onClick={() => signOut(auth)}>Logout</button>
        </div>
      </div>

      <div className="messages">
        {messages.length === 0 && (
          <p style={{ color: '#888' }}><em>Start a conversation with BloomBot 🌸</em></p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="message bot">BloomBot is typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-row">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Say something to BloomBot..."
          disabled={loading}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}




