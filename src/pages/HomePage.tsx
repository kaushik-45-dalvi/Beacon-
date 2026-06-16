import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Bell, BarChart3, Zap, ArrowRight,
  CheckCircle2, Lock, Globe2, Users, ChevronRight
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

const STATS = [
  { value: '2s', label: 'Avg. check time' },
  { value: '99.5%', label: 'Uptime SLA' },
  { value: '10K+', label: 'Domains monitored' },
  { value: '0', label: 'Logins for basic check' },
];

export default function HomePage() {
  const [result, setResult] = useState<CertCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
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
