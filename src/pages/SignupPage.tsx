import { useEffect } from 'react';
import { SignUp } from '@clerk/clerk-react';
import { updateSEO } from '../utils/seo';
import './AuthPage.css';

export default function SignupPage() {
  useEffect(() => {
    updateSEO(
      'Create Free Account | BEACON',
      'Start monitoring up to 5 domains for free with email expiry alerts.'
    );
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="grid-dots auth-grid" />
        <div className="glow-orb auth-orb" />
      </div>

      <div className="auth-clerk-container">
        <SignUp signInUrl="/login" forceRedirectUrl="/dashboard" />
      </div>
    </div>
  );
}
