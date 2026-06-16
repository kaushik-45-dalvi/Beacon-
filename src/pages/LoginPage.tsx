import { useEffect } from 'react';
import { SignIn } from '@clerk/clerk-react';
import { updateSEO } from '../utils/seo';
import './AuthPage.css';

export default function LoginPage() {
  useEffect(() => {
    updateSEO(
      'Sign In | BEACON SSL',
      'Log in to your BEACON account to manage domain SSL monitoring.'
    );
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="grid-dots auth-grid" />
        <div className="glow-orb auth-orb" />
      </div>

      <div className="auth-clerk-container">
        <SignIn signUpUrl="/signup" forceRedirectUrl="/dashboard" />
      </div>
    </div>
  );
}
