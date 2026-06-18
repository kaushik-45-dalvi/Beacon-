import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Bell, BarChart3, Zap, ArrowRight,
  CheckCircle2, Lock, Globe2, Users, ChevronRight,
  Key, Mail, GitBranch, AlertCircle, Calendar
} from 'lucide-react';
import DomainChecker from '../components/DomainChecker';
import CertResult from '../components/CertResult/CertResult';
import { CertCheckResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { updateSEO } from '../utils/seo';
import './HomePage.css';

const FEATURES = [
  {
    icon: <Zap size={20} />,
    title: 'Instant Checks',
    desc: 'Full TLS certificate chain retrieved in under 2 seconds. No login required.',
  },
  {
    icon: <Bell size={20} />,
    title: 'Smart Alerts',
    desc: 'Email, Slack, and webhook alerts 30, 14, 7, and 1 day before expiry.',
  },
  {
    icon: <BarChart3 size={20} />,
    title: 'Chain Visualization',
    desc: 'See your full certificate chain: Root → Intermediate → Leaf, beautifully rendered.',
  },
  {
    icon: <Shield size={20} />,
    title: 'OCSP Validation',
    desc: 'Real-time revocation status checks. Know if a cert has been revoked instantly.',
  },
  {
    icon: <Globe2 size={20} />,
    title: 'Multi-Domain',
    desc: 'Monitor all your domains — api.example.com, cdn.example.com, staging.example.com.',
  },
  {
    icon: <Users size={20} />,
    title: 'Team Access',
    desc: 'Invite your team to the shared dashboard. Everyone gets alerts independently.',
  },
];

const FEATURE_SPOTLIGHT = [
  {
    id: 'chain',
    icon: <GitBranch size={22} />,
    label: 'Full Chain Visualized',
    title: 'Root-to-Leaf Chain, Always Visible',
    desc: 'Don\'t guess at your chain. Beacon traces every certificate link from your domain leaf cert through every intermediate, all the way to the trusted root CA — rendered in a collapsible, interactive tree.',
    badge: { text: 'Chain Complete', color: 'green' },
    preview: (
      <div className="spotlight-preview chain-preview">
        <div className="chain-node-demo leaf">
          <div className="chain-node-dot accent-dot" />
          <div>
            <div className="chain-node-demo-label">example.com</div>
            <div className="chain-node-demo-type">Domain Certificate</div>
          </div>
          <span className="demo-badge green">Valid</span>
        </div>
        <div className="chain-connector-demo"><span>↓ signed by</span></div>
        <div className="chain-node-demo intermediate">
          <div className="chain-node-dot yellow-dot" />
          <div>
            <div className="chain-node-demo-label">Let's Encrypt R3</div>
            <div className="chain-node-demo-type">Intermediate CA</div>
          </div>
          <span className="demo-badge yellow">Trusted</span>
        </div>
        <div className="chain-connector-demo"><span>↓ signed by</span></div>
        <div className="chain-node-demo root">
          <div className="chain-node-dot green-dot" />
          <div>
            <div className="chain-node-demo-label">ISRG Root X1</div>
            <div className="chain-node-demo-type">Root CA</div>
          </div>
          <span className="demo-badge green">Secure</span>
        </div>
      </div>
    )
  },
  {
    id: 'expiry',
    icon: <Calendar size={22} />,
    label: 'Exact Expiry + Days Left',
    title: 'Know Exactly When You\'ll Expire',
    desc: 'Not just "a date" — Beacon shows a visual timeline of your cert\'s lifetime, the exact expiry timestamp, and a real-time countdown of days remaining. Color-coded: green when safe, yellow when close, red when critical.',
    badge: { text: '87 days left', color: 'green' },
    preview: (
      <div className="spotlight-preview expiry-preview">
        <div className="expiry-demo-header">
          <span className="expiry-demo-domain">example.com</span>
          <span className="expiry-demo-days" style={{ color: 'var(--green)' }}>87</span>
          <span className="expiry-demo-unit">days left</span>
        </div>
        <div className="expiry-timeline-demo">
          <div className="expiry-track-demo">
            <div className="expiry-fill-demo" style={{ width: '76%', background: 'linear-gradient(90deg, rgba(71,158,111,0.3), var(--green))' }} />
            <div className="expiry-cursor-demo" style={{ left: '76%', borderColor: 'var(--green)' }}>
              <span className="expiry-cursor-label" style={{ color: 'var(--green)' }}>Today</span>
            </div>
          </div>
        </div>
        <div className="expiry-demo-dates">
          <span>Issued: Jan 12, 2025</span>
          <span style={{ color: 'var(--green)' }}>Expires: Sep 14, 2025</span>
        </div>
        <div className="expiry-demo-meta">76% of certificate lifetime used</div>
      </div>
    )
  },
  {
    id: 'issuer',
    icon: <Key size={22} />,
    label: 'Issuer, SANs & Key Strength',
    title: 'Full Technical Breakdown at a Glance',
    desc: 'Who issued it, what domains it covers (SANs), what algorithm and key size protects it — all laid out in a clean metadata grid. From RSA-2048 to ECDSA P-256, know your cert\'s cryptographic strength instantly.',
    badge: { text: 'RSA 2048-bit', color: 'accent' },
    preview: (
      <div className="spotlight-preview issuer-preview">
        <div className="issuer-grid-demo">
          <div className="issuer-cell">
            <div className="issuer-cell-label">Issuer</div>
            <div className="issuer-cell-value mono-sm">Let's Encrypt R3</div>
          </div>
          <div className="issuer-cell">
            <div className="issuer-cell-label">Key Type</div>
            <div className="issuer-cell-value">RSA 2048-bit</div>
          </div>
          <div className="issuer-cell">
            <div className="issuer-cell-label">Sig Algorithm</div>
            <div className="issuer-cell-value">SHA256withRSA</div>
          </div>
          <div className="issuer-cell">
            <div className="issuer-cell-label">OCSP Status</div>
            <div className="issuer-cell-value"><span className="demo-badge green">Not Revoked</span></div>
          </div>
        </div>
        <div className="san-demo">
          <div className="san-demo-label">Subject Alternative Names (3)</div>
          <div className="san-tags-demo">
            <span className="san-tag-demo">example.com</span>
            <span className="san-tag-demo">www.example.com</span>
            <span className="san-tag-demo">api.example.com</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'ocsp',
    icon: <AlertCircle size={22} />,
    label: 'OCSP Revocation Status',
    title: 'Real-Time Revocation Checks',
    desc: 'A valid cert isn\'t always a safe cert. Beacon queries the OCSP (Online Certificate Status Protocol) endpoint in real-time to check whether the CA has revoked your certificate — and alerts you immediately if it has.',
    badge: { text: 'Not Revoked', color: 'green' },
    preview: (
      <div className="spotlight-preview ocsp-preview">
        <div className="ocsp-status-demo">
          <div className="ocsp-icon-demo">
            <Shield size={28} style={{ color: 'var(--green)' }} />
          </div>
          <div>
            <div className="ocsp-status-label">OCSP Response</div>
            <div className="ocsp-status-value" style={{ color: 'var(--green)' }}>Good — Not Revoked</div>
          </div>
        </div>
        <div className="ocsp-detail-rows">
          <div className="ocsp-detail-row">
            <span>Responder</span>
            <span className="mono-sm">r3.o.lencr.org</span>
          </div>
          <div className="ocsp-detail-row">
            <span>This Update</span>
            <span>Jun 18, 2025</span>
          </div>
          <div className="ocsp-detail-row">
            <span>Next Update</span>
            <span>Jun 25, 2025</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'alerts',
    icon: <Mail size={22} />,
    label: 'Email Alerts Before Expiry',
    title: 'Never Get Caught Off Guard Again',
    desc: 'Set it and forget it. Beacon sends proactive email (and Slack/webhook) alerts at 30, 14, 7, and 1 day before your certificate expires — giving your team plenty of time to renew before users see a warning.',
    badge: { text: 'Alert Sent', color: 'accent' },
    preview: (
      <div className="spotlight-preview alert-preview">
        <div className="alert-email-demo">
          <div className="alert-email-header">
            <div className="alert-email-from">
              <span className="alert-dot accent-dot-sm" />
              <span className="mono-sm">alerts@beacon.dev</span>
            </div>
            <span className="alert-time-badge">7 days</span>
          </div>
          <div className="alert-email-subject">⚠️ SSL Cert Expiring: api.example.com</div>
          <div className="alert-email-body">
            Your SSL certificate for <strong>api.example.com</strong> expires in <strong style={{ color: 'var(--yellow)' }}>7 days</strong>. Renew now to avoid service disruption.
          </div>
          <div className="alert-chips-demo">
            <span className="alert-chip active">30 days</span>
            <span className="alert-chip active">14 days</span>
            <span className="alert-chip active current">7 days ←</span>
            <span className="alert-chip">1 day</span>
          </div>
        </div>
      </div>
    )
  },
];

const STATS = [
  { value: '2s', label: 'Avg. check time' },
  { value: '99.5%', label: 'Uptime SLA' },
  { value: '10K+', label: 'Domains monitored' },
  { value: '0', label: 'Logins for basic check' },
];

export default function HomePage() {
  const [result, setResult] = useState<CertCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSpotlight, setActiveSpotlight] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    updateSEO(
      'BEACON | Instant SSL Certificate Checker & Expiry Monitor',
      "Check any domain's SSL certificate instantly. View full root-to-leaf chains, expiry timelines, and set automated Slack or email alerts before your certificates expire."
    );
  }, []);

  const handleResult = (r: CertCheckResult | null) => {
    setResult(r);
    if (r) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <div className="home-page">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="hero">
        {/* Background elements */}
        <div className="hero-bg">
          <div className="grid-dots hero-grid" />
          <div className="glow-orb hero-orb-1" />
          <div className="glow-orb hero-orb-2" />
          <div className="right-side-glow" />
        </div>

        <div className="container hero-grid-layout">
          <div className="hero-text-column">
            {/* Announcement chip */}
            <Link to={isAuthenticated ? "/dashboard" : "/signup"} className="hero-chip animate-fade-in">
              Zero-friction SSL certificate monitoring
              <ChevronRight size={12} className="chip-arrow" />
            </Link>

            {/* Headline */}
            <h1 className="hero-headline animate-fade-up delay-1">
              <span className="hero-headline-top">Your SSL certs.</span>
              <span className="hero-headline-accent">Under control.</span>
            </h1>

            {/* Sub */}
            <p className="hero-sub body-lg text-secondary animate-fade-up delay-2">
              Check any domain's SSL certificate instantly. See the full chain, expiry countdown,
              and get alerted before disaster strikes. No sign-up required.
            </p>

            {/* 5-feature checkmarks strip */}
            <div className="hero-checkmarks animate-fade-up delay-2">
              {[
                { icon: <GitBranch size={13} />, text: 'Full chain visualized' },
                { icon: <Calendar size={13} />, text: 'Exact expiry & days left' },
                { icon: <Key size={13} />, text: 'Issuer, SANs & key strength' },
                { icon: <AlertCircle size={13} />, text: 'OCSP revocation check' },
                { icon: <Mail size={13} />, text: 'Email alerts before expiry' },
              ].map((item, i) => (
                <div key={i} className="hero-check-item">
                  <span className="hero-check-icon">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Checker */}
            <div className="hero-checker animate-fade-up delay-3">
              <DomainChecker onResult={handleResult} onLoading={setLoading} />
            </div>

            {/* LOADING STATE */}
            {loading && (
              <div className="checking-overlay-inline animate-fade-in" style={{ width: '100%', marginTop: '1.25rem' }}>
                <div className="checking-card">
                  <div className="checking-spinner">
                    <div className="spinner-ring" />
                    <Shield size={20} className="spinner-icon" />
                  </div>
                  <div>
                    <p className="heading">Fetching certificate chain...</p>
                    <p className="body-sm text-secondary">Establishing TLS connection and parsing certificate</p>
                  </div>
                </div>
              </div>
            )}

            {/* Trust line */}
            <p className="hero-trust label text-tertiary animate-fade-up delay-4">
              <Lock size={12} /> Certificate data is publicly accessible — we never store private keys
            </p>
          </div>

          {/* Right column placeholder to maintain grid proportions */}
          <div className="hero-visual-container hide-mobile" />
        </div>

        {/* Absolute positioned SSL Connected Network Visual extending to the right edge of screen */}
        <div className="hero-absolute-image-wrapper hide-mobile">
          <div className="network-nodes-visual animate-fade-in">
            {/* SVG Connections Layer */}
            <svg className="network-svg-canvas" viewBox="0 0 500 400" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Define Glow Filter for active lines */}
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Base static connection lines (low-opacity) */}
              <path className="net-line" d="M 130,60 C 250,60 250,100 370,100" />
              <path className="net-line" d="M 130,130 C 250,130 250,100 370,100" />
              <path className="net-line" d="M 130,200 L 370,200" />
              <path className="net-line" d="M 130,270 C 250,270 250,300 370,300" />
              <path className="net-line" d="M 130,340 C 250,340 250,300 370,300" />

              {/* Cross connection lines */}
              <path className="net-line" d="M 130,130 C 250,130 250,200 370,200" />
              <path className="net-line" d="M 130,270 C 250,270 250,200 370,200" />

              {/* Glowing active flow overlay paths */}
              <path className="net-flow-pulse" d="M 130,60 C 250,60 250,100 370,100" />
              <path className="net-flow-pulse" d="M 130,130 C 250,130 250,100 370,100" />
              <path className="net-flow-pulse" d="M 130,200 L 370,200" />
              <path className="net-flow-pulse" d="M 130,270 C 250,270 250,300 370,300" />
              <path className="net-flow-pulse" d="M 130,340 C 250,340 250,300 370,300" />
            </svg>

            {/* Left Monitored Nodes (5) */}
            <div className="network-node node-left node-l1">
              <span className="node-status-dot green-pulse" />
              <span className="node-text">api.beacon.dev</span>
            </div>
            <div className="network-node node-left node-l2">
              <span className="node-status-dot green-pulse" />
              <span className="node-text">www.beacon.dev</span>
            </div>
            <div className="network-node node-left node-l3">
              <span className="node-status-dot green-pulse" />
              <span className="node-text">dev.beacon.dev</span>
            </div>
            <div className="network-node node-left node-l4">
              <span className="node-status-dot green-pulse" />
              <span className="node-text">mail.beacon.dev</span>
            </div>
            <div className="network-node node-left node-l5">
              <span className="node-status-dot green-pulse" />
              <span className="node-text">cdn.beacon.dev</span>
            </div>

            {/* Right Certificate Chain Nodes (3) */}
            <div className="network-node node-right node-r1">
              <span className="node-text">leaf cert</span>
              <span className="node-chain-badge">valid</span>
            </div>
            <div className="network-node node-right node-r2">
              <span className="node-text">intermediate</span>
              <span className="node-chain-badge">trusted</span>
            </div>
            <div className="network-node node-right node-r3">
              <span className="node-text">root ca</span>
              <span className="node-chain-badge">secure</span>
            </div>
          </div>
        </div>
      </section>



      {/* ── RESULTS ───────────────────────────────────────────────── */}
      {result && !loading && (
        <div className="results-section container" ref={resultsRef}>
          <CertResult result={result} />

          {!isAuthenticated && (
            <div className="results-cta card card-accent">
              <div className="results-cta-content">
                <Bell size={20} className="text-accent" />
                <div>
                  <h3 className="heading">Want expiry alerts for {result.domain}?</h3>
                  <p className="body-sm text-secondary">
                    Create a free account to monitor this domain and get email alerts before it expires.
                  </p>
                </div>
              </div>
              <Link to="/signup" className="btn btn-primary" id="hero-cta-signup">
                Monitor for Free <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── STATS ─────────────────────────────────────────────────── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((stat, i) => (
              <div key={i} className="stat-card card animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="stat-value display-md text-accent">{stat.value}</div>
                <div className="stat-label label text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE SPOTLIGHT ─────────────────────────────────────── */}
      <section className="spotlight-section section">
        <div className="container">
          <div className="section-header">
            <span className="label text-accent">What You Get</span>
            <h2 className="display-md">Five features.<br/>Zero compromises.</h2>
            <p className="body-lg text-secondary">
              Every check gives you the complete picture — no guesswork, no digging through openssl commands.
            </p>
          </div>

          <div className="spotlight-layout">
            {/* Tab navigation */}
            <div className="spotlight-tabs">
              {FEATURE_SPOTLIGHT.map((f, i) => (
                <button
                  key={f.id}
                  id={`spotlight-tab-${f.id}`}
                  className={`spotlight-tab ${activeSpotlight === i ? 'active' : ''}`}
                  onClick={() => setActiveSpotlight(i)}
                >
                  <span className="spotlight-tab-icon">{f.icon}</span>
                  <div className="spotlight-tab-text">
                    <div className="spotlight-tab-label">{f.label}</div>
                  </div>
                  <span className={`spotlight-tab-badge badge-${f.badge.color}`}>
                    {f.badge.text}
                  </span>
                </button>
              ))}
            </div>

            {/* Content panel */}
            <div className="spotlight-panel animate-fade-in" key={activeSpotlight}>
              <div className="spotlight-panel-text">
                <div className="spotlight-panel-icon">
                  {FEATURE_SPOTLIGHT[activeSpotlight].icon}
                </div>
                <h3 className="display-md spotlight-panel-title">
                  {FEATURE_SPOTLIGHT[activeSpotlight].title}
                </h3>
                <p className="body-lg text-secondary spotlight-panel-desc">
                  {FEATURE_SPOTLIGHT[activeSpotlight].desc}
                </p>
                <Link
                  to={isAuthenticated ? '/dashboard' : '/signup'}
                  className="btn btn-primary"
                  id={`spotlight-cta-${FEATURE_SPOTLIGHT[activeSpotlight].id}`}
                >
                  Try it free <ArrowRight size={16} />
                </Link>
              </div>
              <div className="spotlight-panel-preview">
                {FEATURE_SPOTLIGHT[activeSpotlight].preview}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section className="features-section section">
        <div className="container">
          <div className="section-header">
            <span className="label text-accent">Features</span>
            <h2 className="display-md">Everything you need.<br/>Nothing you don't.</h2>
            <p className="body-lg text-secondary">
              Built for developers and DevOps engineers who care about uptime.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card card animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="feature-icon">
                  {f.icon}
                </div>
                <h3 className="heading feature-title">{f.title}</h3>
                <p className="body-sm text-secondary feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="how-section section">
        <div className="container">
          <div className="how-grid">
            <div className="how-content">
              <span className="label text-accent">How it works</span>
              <h2 className="display-md">One domain. All the insight.</h2>
              <p className="body-lg text-secondary">
                We establish a TLS handshake to your domain, extract the full certificate chain,
                validate each link, check OCSP revocation status, and return everything in under 2 seconds.
              </p>

              <div className="how-steps">
                {[
                  { n: '01', t: 'Enter domain', d: 'Paste any domain. No www needed, no https needed.' },
                  { n: '02', t: 'Chain extracted', d: 'We fetch the full cert chain via TLS handshake.' },
                  { n: '03', t: 'Visualized', d: 'See Root → Intermediate → Leaf, with all metadata.' },
                  { n: '04', t: 'Set alerts (optional)', d: 'Sign up to get notified before anything breaks.' },
                ].map((step, i) => (
                  <div key={i} className="how-step">
                    <div className="step-num label text-accent">{step.n}</div>
                    <div>
                      <div className="heading">{step.t}</div>
                      <p className="body-sm text-secondary">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="how-visual">
              <div className="how-mock-card">
                <div className="how-mock-header">
                  <div className="mock-dots">
                    <span /><span /><span />
                  </div>
                  <span className="mock-url mono">beacon.dev</span>
                </div>
                <div className="how-mock-body">
                  <div className="mock-row">
                    <span className="label text-secondary">Domain</span>
                    <span className="mono body-sm">example.com</span>
                  </div>
                  <div className="mock-row">
                    <span className="label text-secondary">Status</span>
                    <span className="badge badge-green">Valid</span>
                  </div>
                  <div className="mock-row">
                    <span className="label text-secondary">Expires</span>
                    <span className="text-green body-sm">201 days</span>
                  </div>
                  <div className="mock-row">
                    <span className="label text-secondary">Chain</span>
                    <span className="badge badge-green">Complete ✓</span>
                  </div>
                  <div className="mock-row">
                    <span className="label text-secondary">OCSP</span>
                    <span className="badge badge-green">Good</span>
                  </div>
                  <div className="mock-divider" />
                  <div className="mock-chain">
                    <div className="mock-chain-node accent">example.com</div>
                    <div className="mock-chain-arrow">↓ signed by</div>
                    <div className="mock-chain-node yellow">Let's Encrypt R3</div>
                    <div className="mock-chain-arrow">↓ signed by</div>
                    <div className="mock-chain-node green">ISRG Root X1</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="cta-section section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-bg-orb" />
            <h2 className="display-md cta-title">Stop worrying about cert expiry.</h2>
            <p className="body-lg text-secondary cta-sub">
              Join thousands of developers monitoring their SSL certificates with Beacon.
              Start for free — no credit card required.
            </p>
            <div className="cta-actions">
              <Link to="/signup" className="btn btn-primary btn-lg" id="cta-signup-main">
                Start Monitoring Free <ArrowRight size={18} />
              </Link>
              <Link to="/pricing" className="btn btn-secondary btn-lg" id="cta-pricing">
                View Pricing
              </Link>
            </div>
            <div className="cta-bullets">
              {['Free for 5 domains', '30-day email alerts included', 'No credit card'].map((b, i) => (
                <span key={i} className="cta-bullet">
                  <CheckCircle2 size={14} className="text-accent" /> {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
