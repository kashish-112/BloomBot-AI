import { useState, useEffect } from 'react';
import { auth, provider, isMobile, isSafari, signInWithPopup, signInWithRedirect, getRedirectResult } from '../firebase';

export default function LoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // For Safari and iOS browsers with storage issues, we need to use a direct approach
  // rather than relying on session storage for the redirect
  const isStoragePartitioned = isMobile && isSafari;

  useEffect(() => {
    if (loading) return;

    // Only handle redirect results if we're not in a problematic browser environment
    if (!isStoragePartitioned) {
      setLoading(true);
      
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            console.log('Redirect login successful:', result.user.displayName);
          }
        })
        .catch((error) => {
          console.error('Redirect error:', error.code, error.message);
          
          // Some errors are expected after redirect, don't show them to the user
          if (error.code === 'auth/popup-closed-by-user' || 
              error.code === 'auth/cancelled-popup-request' ||
              error.code === 'auth/popup-blocked') {
            // These are expected errors, don't show to user
          } else if (error.code === 'auth/null-user' || 
                     error.code === 'auth/missing-initial-state' ||
                     error.code === 'auth/session-storage-unavailable') {
            console.log('Storage-related error detected - will use popup for future logins');
          } else {
            setError("Login failed. Please try again.");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isStoragePartitioned]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // For Safari on iOS and other problematic browsers, use popup always
      // Despite documented issues, popup sometimes works better than redirect on iOS
      if (isStoragePartitioned) {
        console.log("Using popup for iOS Safari login due to storage issues");
        try {
          const result = await signInWithPopup(auth, provider);
          console.log('Popup login successful on iOS:', result.user?.displayName);
        } catch (popupError) {
          console.error("Popup failed on iOS, falling back to redirect:", popupError);
          // Last resort - try redirect, but warn about potential issues
          window.sessionStorage.setItem('attemptedRedirect', 'true');
          window.sessionStorage.setItem('loginAttemptTime', Date.now().toString());
          await signInWithRedirect(auth, provider);
        }
      } else if (isMobile) {
        console.log("Using redirect for mobile login");
        await signInWithRedirect(auth, provider);
      } else {
        console.log("Using popup for desktop login");
        const result = await signInWithPopup(auth, provider);
        console.log('Popup login successful:', result.user?.displayName);
      }
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      
      if (error.code === 'auth/popup-closed-by-user' || 
          error.code === 'auth/cancelled-popup-request') {
        // User closed the popup, no need to show error
      } else if (error.code === 'auth/popup-blocked') {
        setError("Pop-up was blocked. Please allow pop-ups for this site.");
      } else if (error.code === 'auth/missing-initial-state') {
        setError("Login failed due to browser storage restrictions. Try again or use a different browser.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleLogin}
        disabled={loading}
        className="login-button"
      >
        {loading ? 'Signing in...' : 'Get Started'}
      </button>
      {error && <p className="error-message" style={{color: '#e53e3e', marginTop: '0.5rem'}}>{error}</p>}
    </>
  );
} 