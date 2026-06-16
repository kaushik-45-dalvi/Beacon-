import { useEffect } from 'react';
import { Lock, Mail, Shield, Clock, Users, Server, Key } from 'lucide-react';
import { updateSEO } from '../utils/seo';
import './SecurityPage.css';

const SECURITY_SECTIONS = [
  {
    icon: Lock,
    title: 'Encryption in Transit',
    body: 'All communication with BEACON is encrypted using TLS 1.3. We enforce HTTPS across all endpoints, including our API, dashboard, and public certificate checker. We maintain an A+ SSL Labs rating on all our subdomains.'
  },
  {
    icon: Server,
    title: 'Encryption at Rest',
    body: 'User data, including account information and monitored domain details, is encrypted at rest using AES-256. Database backups are similarly encrypted and stored in secure, geographically redundant facilities.'
  },
  {
    icon: Shield,
    title: 'Authentication & Access Control',
    body: 'User authentication is handled by Clerk, a SOC 2 compliant authentication provider. We support multi-factor authentication (MFA) and OAuth 2.0. API access is governed by scoped API keys with granular permissions.'
  },
  {
    icon: Key,
    title: 'API Key Security',
    body: 'API keys are hashed using bcrypt before storage. Keys are displayed only once at creation. We support key rotation and revocation. We recommend using environment variables or a secrets manager to store API keys.'
  },
  {
    icon: Users,
    title: 'Third-Party Security',
    body: 'We carefully vet all third-party service providers. Our payment processing is handled by Stripe (PCI DSS Level 1). Authentication is handled by Clerk (SOC 2 Type II). We maintain data processing agreements with all subprocessors.'
  },
  {
    icon: Clock,
    title: 'Incident Response',
    body: 'We have a documented incident response plan that includes detection, containment, eradication, and recovery phases. We commit to notifying affected users within 72 hours of confirmed security incidents involving personal data.'
  }
];

export default function SecurityPage() {
  useEffect(() => {
    updateSEO(
      'Security | BEACON SSL',
      'BEACON security practices, encryption standards, and how we protect your data.'
    );
  }, []);

  return (
    <div className="legal-page security-page">
      <div className="legal-bg">
        <div className="grid-dots legal-grid" />
        <div className="glow-orb legal-orb-1" />
        <div className="glow-orb legal-orb-2" />
      </div>

      <div className="container legal-container">
        <div className="legal-header animate-fade-in">
          <div className="legal-icon-wrap">
            <Lock size={20} />
          </div>
          <span className="label text-accent">Security</span>
          <h1 className="display-lg legal-title">Security at BEACON</h1>
          <p className="body-lg text-secondary">
            Our commitment to protecting your data and infrastructure.
          </p>
        </div>

        <div className="legal-content card card-elevated animate-fade-up">
          <p className="body-md text-secondary security-intro">
            BEACON takes security seriously. Since our service is about SSL certificate monitoring, we hold ourselves to the same high standards we help our users maintain. Below is an overview of our security posture.
          </p>

          <div className="security-grid">
            {SECURITY_SECTIONS.map((section, idx) => (
              <div key={idx} className="security-card">
                <div className="security-card-icon">
                  <section.icon size={20} />
                </div>
                <h3 className="heading">{section.title}</h3>
                <p className="body-sm text-secondary">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="divider" />

          <section>
            <h2>Secure Development</h2>
            <p>We follow secure coding practices including regular dependency scanning, static analysis, and peer review for all code changes. Our build pipeline includes automated security testing. We use signed commits and enforce branch protection rules.</p>
          </section>

          <section>
            <h2>Vulnerability Disclosure</h2>
            <p>We welcome responsible disclosure of security vulnerabilities. If you discover a security issue, please report it to us at <a href="mailto:security@beacon.dev">security@beacon.dev</a>. We commit to:</p>
            <ul>
              <li>Acknowledging receipt within 24 hours</li>
              <li>Providing an initial assessment within 72 hours</li>
              <li>Working diligently on a fix based on severity</li>
              <li>Keeping you informed throughout the process</li>
            </ul>
            <p>We do not currently operate a formal bug bounty program but will recognize researchers in our security acknowledgments with permission.</p>
          </section>

          <section>
            <h2>Compliance & Certifications</h2>
            <p>We are committed to achieving and maintaining industry-standard security certifications. While we are currently in the process of obtaining SOC 2 Type II certification, we already implement controls aligned with SOC 2 principles, CIS benchmarks, and OWASP best practices.</p>
          </section>

          <section>
            <h2>Contact Our Security Team</h2>
            <p>For security-related inquiries or to report a vulnerability:</p>
            <p className="contact-row">
              <Mail size={16} />
              <a href="mailto:security@beacon.dev">security@beacon.dev</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
