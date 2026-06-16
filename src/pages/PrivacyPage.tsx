import { useEffect } from 'react';
import { Shield, Mail } from 'lucide-react';
import { updateSEO } from '../utils/seo';
import './PrivacyPage.css';

export default function PrivacyPage() {
  useEffect(() => {
    updateSEO(
      'Privacy Policy | BEACON SSL',
      'How BEACON collects, uses, and protects your data. Your privacy matters to us.'
    );
  }, []);

  return (
    <div className="legal-page">
      <div className="legal-bg">
        <div className="grid-dots legal-grid" />
        <div className="glow-orb legal-orb-1" />
        <div className="glow-orb legal-orb-2" />
      </div>

      <div className="container legal-container">
        <div className="legal-header animate-fade-in">
          <div className="legal-icon-wrap">
            <Shield size={20} />
          </div>
          <span className="label text-accent">Legal</span>
          <h1 className="display-lg legal-title">Privacy Policy</h1>
          <p className="body-lg text-secondary">Last updated: June 1, 2026</p>
        </div>

        <div className="legal-content card card-elevated animate-fade-up">
          <section>
            <h2>1. Information We Collect</h2>
            <p>When you use BEACON, we collect the following types of information:</p>
            <ul>
              <li><strong>Account Information:</strong> When you sign up, we collect your email address and authentication credentials (handled securely via Clerk).</li>
              <li><strong>Domain Data:</strong> The domain names you choose to check or monitor, along with the public certificate information associated with them.</li>
              <li><strong>Usage Data:</strong> We collect anonymized analytics about how you interact with the service to improve our product.</li>
              <li><strong>Payment Data:</strong> If you subscribe to a paid plan, payment processing is handled by our third-party payment processor. We do not store full credit card numbers.</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul>
              <li>Provide, maintain, and improve our SSL certificate monitoring service</li>
              <li>Send you expiry alerts and service-related notifications</li>
              <li>Respond to your support requests and inquiries</li>
              <li>Analyze usage patterns to optimize the user experience</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2>3. Data Sharing & Disclosure</h2>
            <p>We do not sell your personal information. We may share data only in the following circumstances:</p>
            <ul>
              <li><strong>Service Providers:</strong> With trusted third-party services (e.g., Clerk for auth, Stripe for payments) that are contractually bound to protect your data.</li>
              <li><strong>Legal Requirements:</strong> If required by law, regulation, or legal process, or to protect the rights, property, or safety of BEACON, our users, or the public.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with notice to users.</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Retention</h2>
            <p>We retain your account information and monitored domains for as long as your account is active. If you delete your account, we will delete or anonymize your personal data within 30 days. Certificate check history may be retained in anonymized form for service improvement.</p>
          </section>

          <section>
            <h2>5. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data, including encryption in transit (TLS) and at rest, regular security audits, and access controls. However, no method of transmission or storage is 100% secure. See our <a href="/security">Security page</a> for more details.</p>
          </section>

          <section>
            <h2>6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul>
              <li>Access, correct, or delete your personal data</li>
              <li>Restrict or object to processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:privacy@beacon.dev">privacy@beacon.dev</a>.</p>
          </section>

          <section>
            <h2>7. Cookies</h2>
            <p>We use essential cookies for authentication and service functionality. We do not use tracking cookies or third-party advertising cookies. You can control cookie preferences through your browser settings.</p>
          </section>

          <section>
            <h2>8. Third-Party Links</h2>
            <p>Our service may contain links to third-party websites (e.g., Let's Encrypt, SSL Labs, crt.sh). We are not responsible for the privacy practices of these sites. We encourage you to review their privacy policies before providing any personal information.</p>
          </section>

          <section>
            <h2>9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify users of material changes via email or through the service. Your continued use of BEACON after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2>10. Contact</h2>
            <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
            <p className="contact-row">
              <Mail size={16} />
              <a href="mailto:privacy@beacon.dev">privacy@beacon.dev</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
