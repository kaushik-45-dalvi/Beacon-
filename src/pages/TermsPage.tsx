import { useEffect } from 'react';
import { FileText, Mail } from 'lucide-react';
import { updateSEO } from '../utils/seo';
import './TermsPage.css';

export default function TermsPage() {
  useEffect(() => {
    updateSEO(
      'Terms of Service | BEACON SSL',
      'Terms and conditions governing the use of BEACON SSL certificate monitoring service.'
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
            <FileText size={20} />
          </div>
          <span className="label text-accent">Legal</span>
          <h1 className="display-lg legal-title">Terms of Service</h1>
          <p className="body-lg text-secondary">Last updated: June 1, 2026</p>
        </div>

        <div className="legal-content card card-elevated animate-fade-up">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using BEACON ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service. These terms apply to all visitors, users, and others who access or use the Service.</p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>BEACON provides SSL/TLS certificate checking, visualization, and monitoring services. Users can check individual domain certificates, monitor multiple domains for expiration, configure alert preferences, and access certificate chain analysis. The Service checks publicly available certificate information and does not modify or interfere with any domain's certificate configuration.</p>
          </section>

          <section>
            <h2>3. User Accounts</h2>
            <p>To access monitoring features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration. You must be at least 13 years of age to use the Service.</p>
          </section>

          <section>
            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Attempt to circumvent rate limits, access controls, or other security measures</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Reverse-engineer, decompile, or extract source code from the Service</li>
              <li>Use automated tools to scrape or extract data beyond reasonable usage limits</li>
            </ul>
          </section>

          <section>
            <h2>5. Monitoring Limits & Fair Use</h2>
            <p>Free accounts are limited to monitoring 5 domains. Pro accounts are limited to 50 domains unless otherwise specified. We reserve the right to impose reasonable rate limits on API access and certificate checks to ensure service stability for all users.</p>
          </section>

          <section>
            <h2>6. Payment & Billing</h2>
            <p>Paid plans are billed monthly in advance. Payments are processed securely by our third-party payment processor. All fees are non-refundable except as required by applicable law. We may change our pricing with 30 days' notice. Failure to pay may result in suspension or downgrade of your account.</p>
          </section>

          <section>
            <h2>7. Cancellation & Termination</h2>
            <p>You may cancel your subscription at any time from your billing dashboard. Cancellation takes effect at the end of your current billing cycle. We may terminate or suspend your account for violation of these terms, with or without notice. Upon termination, your right to use the Service ceases immediately.</p>
          </section>

          <section>
            <h2>8. Intellectual Property</h2>
            <p>The BEACON name, logo, design, and software are proprietary. You may not use our branding without prior written consent. The certificate data displayed through the Service is public information; however, our presentation, analysis, and visualization of that data are protected by copyright.</p>
          </section>

          <section>
            <h2>9. Disclaimer of Warranties</h2>
            <p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. BEACON DOES NOT GUARANTEE THAT CERTIFICATE CHECKS ARE ERROR-FREE OR THAT ALERTS WILL BE DELIVERED IN ALL CIRCUMSTANCES. BEACON IS A TOOL TO AID IN CERTIFICATE MANAGEMENT AND SHOULD NOT BE YOUR SOLE RELIANCE FOR CERTIFICATE EXPIRATION PREVENTION.</p>
          </section>

          <section>
            <h2>10. Limitation of Liability</h2>
            <p>BEACON SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU HAVE PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.</p>
          </section>

          <section>
            <h2>11. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. We will notify users of material changes via email or through the Service. Continued use after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2>12. Governing Law</h2>
            <p>These terms shall be governed by the laws of the State of California, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of San Francisco County, California.</p>
          </section>

          <section>
            <h2>13. Contact</h2>
            <p>For questions about these Terms of Service, please contact us:</p>
            <p className="contact-row">
              <Mail size={16} />
              <a href="mailto:legal@beacon.dev">legal@beacon.dev</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
