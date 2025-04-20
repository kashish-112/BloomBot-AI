import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function UserOnboarding({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [userData, setUserData] = useState({
    gender: '',
    age: '',
    seesTherapist: null,
    takesMedication: null
  });
  const [loading, setLoading] = useState(false);
  
  const userName = user?.displayName || 'there';

  const steps = [
    {
      title: `Welcome, ${userName}! 🌸`,
      content: "Let's start by getting to know you a bit better. This helps us provide more personalized support.",
      inputs: []
    },
    {
      title: "About You",
      content: "Please share some basic information about yourself.",
      inputs: [
        { id: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Non-binary", "Prefer not to say"] },
        { id: "age", label: "Age", type: "select", options: ["Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65 or older"] }
      ]
    },
    {
      title: "Mental Health Support",
      content: "This information helps us understand your current support system.",
      inputs: [
        { id: "seesTherapist", label: "Are you currently speaking with a mental health professional?", type: "radio" },
      ]
    },
    {
      title: "Medication",
      content: "Please note that BloomBot is not a substitute for professional medical advice.",
      inputs: [
        { id: "takesMedication", label: "Are you currently taking any medications for mental health?", type: "radio" },
      ]
    },
    {
      title: "Important Note",
      content: userData.seesTherapist || userData.takesMedication ? 
        "Thank you for sharing. It's great that you're already receiving professional support. BloomBot can provide additional emotional support, but please continue working with your healthcare provider for medical advice." : 
        "Thank you for sharing. BloomBot is here to provide emotional support, but if you're experiencing severe symptoms, please consider reaching out to a mental health professional.",
      inputs: []
    }
  ];

  useEffect(() => {
    // Debug logging to check component rendering
    console.log("UserOnboarding rendered with user:", user?.displayName);
    console.log("Current step:", step, "of", steps.length);
  }, [step, user]);

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = async () => {
    console.log("Next button clicked on step", step);
    
    // Validate current step
    const currentStep = steps[step];
    const requiredInputs = currentStep.inputs.filter(input => !input.optional);
    
    // Check if all required inputs are filled
    const isStepValid = requiredInputs.every(input => 
      userData[input.id] !== undefined && userData[input.id] !== ''
    );
    
    if (!isStepValid && requiredInputs.length > 0) {
      alert("Please fill out all required fields before continuing.");
      return;
    }

    // If we're on the last step, save data and complete onboarding
    if (step === steps.length - 1) {
      setLoading(true);
      try {
        console.log("Saving user data to Firestore:", userData);
        
        // Save user data to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          onboardingCompleted: true,
          lastUpdated: serverTimestamp()
        });

        // Add welcome message to chat
        const welcomeMessage = `
Welcome to BloomBot, ${user.displayName}! 🌸

I'm here to provide emotional support and be a friendly ear whenever you need someone to talk to. You can share what's on your mind, and I'll do my best to help you navigate your thoughts and feelings.

${userData.seesTherapist || userData.takesMedication ? 
  "I see that you're currently receiving professional support, which is wonderful! I'm here to complement that support, but please continue to follow the guidance of your healthcare providers." : 
  "If at any point you feel you need professional support, I can help you find resources."}

What's on your mind today?
        `.trim();

        onComplete(welcomeMessage);
      } catch (error) {
        console.error("Error saving user data:", error);
        alert("There was an error saving your information. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      // Move to next step
      setStep(prev => prev + 1);
    }
  };

  const currentStep = steps[step];

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="progress-bar">
          <div 
            className="progress" 
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        
        <h2>{currentStep.title}</h2>
        <p>{currentStep.content}</p>
        
        <div className="input-fields">
          {currentStep.inputs.map(input => (
            <div key={input.id} className="input-group">
              <label htmlFor={input.id}>{input.label}</label>
              
              {input.type === 'select' && (
                <select 
                  id={input.id}
                  value={userData[input.id] || ''}
                  onChange={(e) => handleInputChange(input.id, e.target.value)}
                  required={!input.optional}
                >
                  <option value="" disabled>Select an option</option>
                  {input.options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}
              
              {input.type === 'radio' && (
                <div className="radio-options">
                  <div className="radio-option">
                    <input 
                      type="radio" 
                      id={`${input.id}-yes`} 
                      name={input.id}
                      checked={userData[input.id] === true}
                      onChange={() => handleInputChange(input.id, true)}
                    />
                    <label htmlFor={`${input.id}-yes`}>Yes</label>
                  </div>
                  <div className="radio-option">
                    <input 
                      type="radio" 
                      id={`${input.id}-no`} 
                      name={input.id}
                      checked={userData[input.id] === false}
                      onChange={() => handleInputChange(input.id, false)}
                    />
                    <label htmlFor={`${input.id}-no`}>No</label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="button-row">
          {step > 0 && (
            <button 
              className="back-button" 
              onClick={() => setStep(prev => prev - 1)}
              disabled={loading}
            >
              Back
            </button>
          )}
          <button 
            className="next-button" 
            onClick={handleNext}
            disabled={loading}
          >
            {step === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
} 