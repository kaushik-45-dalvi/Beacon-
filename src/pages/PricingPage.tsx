import { useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { updateSEO } from '../utils/seo';
import './PricingPage.css';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for side projects and personal websites.',
    features: [
      { text: 'Monitor up to 5 domains', active: true },
      { text: 'Email expiry alerts (30 & 14 days)', active: true },
      { text: 'Daily certificate check frequency', active: true },
      { text: 'Root-to-leaf chain visualization', active: true },
      { text: 'Slack and custom webhooks', active: false },
      { text: 'REST API access', active: false },
      { text: 'Sub-minute checks', active: false },
    ],
    cta: 'Start Free',
    link: '/signup',
    popular: false,
    id: 'plan-free'
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    desc: 'For production systems and growing SaaS apps.',
    features: [
      { text: 'Monitor up to 50 domains', active: true },
      { text: 'Email, Slack, & custom Webhook alerts', active: true },
      { text: 'Hourly check frequency', active: true },
      { text: 'Root-to-leaf chain visualization', active: true },
      { text: 'Custom alerts triggers (e.g. 7, 3, 1 days)', active: true },
      { text: 'REST API access (1,000 req/day)', active: true },
      { text: 'Sub-minute checks', active: false },
    ],
    cta: 'Upgrade to Pro',
    link: '/signup',
    popular: true,
    id: 'plan-pro'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'tailored pricing',
    desc: 'For large enterprises requiring maximum uptime and security.',
    features: [
      { text: 'Unlimited monitored domains', active: true },
      { text: 'All alert channels (incl. PagerDuty, SMS)', active: true },
      { text: 'Sub-minute check frequency', active: true },
      { text: 'Dedicated checking nodes & proxy IPs', active: true },
      { text: 'Custom alerts triggers & escalation', active: true },
      { text: 'Unlimited REST API access & SDKs', active: true },
      { text: '99.99% checking SLA & support contract', active: true },
    ],
    cta: 'Contact Sales',
    link: 'mailto:sales@beacon.dev',
    popular: false,
    id: 'plan-enterprise'
  }
];

export default function PricingPage() {
  useEffect(() => {
    updateSEO(
      'Pricing Plans | BEACON SSL',
      'Simple, transparent pricing. Scale from personal side projects to enterprise infrastructure SSL alerts.'
    );
  }, []);

  return (
    <div className="pricing-page">
      {/* Background decoration */}
      <div className="pricing-bg">
        <div className="grid-dots pricing-grid" />
        <div className="glow-orb pricing-orb-1" />
        <div className="glow-orb pricing-orb-2" />
      </div>

      <div className="container pricing-container">
        {/* Header */}
        <div className="pricing-header animate-fade-in">
          <span className="label text-accent">Pricing Plans</span>
          <h1 className="display-lg pricing-title">Simple. Transparent.</h1>
          <p className="body-lg text-secondary pricing-subtitle">
            Scale from a single blog to enterprise infrastructure. Protect your site from expired certificates.
          </p>
        </div>

        {/* Pricing Cards Bento Grid */}
        <div className="plans-grid">
          {PLANS.map((plan, i) => (
            <div 
              key={i} 
              className={`plan-card card ${plan.popular ? 'card-accent plan-popular' : ''} animate-fade-up`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {plan.popular && (
                <div className="popular-badge label">
                  <Sparkles size={10} fill="currentColor" /> Popular Choice
                </div>
              )}

              <div className="plan-meta">
                <h3 className="heading plan-name">{plan.name}</h3>
                <p className="body-sm text-secondary plan-desc">{plan.desc}</p>
                <div className="plan-price-row">
                  <span className="display-md plan-price">{plan.price}</span>
                  <span className="body-sm text-secondary plan-period">/ {plan.period}</span>
                </div>
              </div>

              <div className="divider" />

              <ul className="plan-features">
                {plan.features.map((feat, fidx) => (
                  <li key={fidx} className={`feature-item ${feat.active ? '' : 'inactive'}`}>
                    {feat.active ? (
                      <CheckCircle2 size={16} className="feature-icon text-accent" />
                    ) : (
                      <XCircle size={16} className="feature-icon text-tertiary" />
                    )}
                    <span className="body-sm">{feat.text}</span>
                  </li>
                ))}
              </ul>

              <div className="plan-action">
                {plan.link.startsWith('mailto:') ? (
                  <a 
                    href={plan.link} 
                    className="btn btn-secondary w-full btn-lg" 
                    id={plan.id}
                  >
                    {plan.cta} <ArrowRight size={16} />
                  </a>
                ) : (
                  <Link 
                    to={plan.link} 
                    className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'} w-full btn-lg`}
                    id={plan.id}
                  >
                    {plan.cta} <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="section-header">
            <span className="label text-accent">FAQ</span>
            <h2 className="display-md">Got questions? We've got answers.</h2>
          </div>

          <div className="faq-grid">
            {[
              {
                q: 'How does the free plan work?',
                a: 'You can check as many domains as you want using the public checker. If you sign up, you can monitor up to 5 domains continuously, and we will email you if they are within 30 or 14 days of expiring.'
              },
              {
                q: 'What counts as a monitored domain?',
                a: 'Any unique Hostname (e.g. example.com, api.example.com, dev.example.com) counts as one monitored domain. Wildcard domains are supported for cert checking but monitored hostnames must be explicitly set.'
              },
              {
                q: 'How do Slack alerts work?',
                a: 'On the Pro plan, you can specify a Slack Webhook URL. When a domain is entering its expiry warning periods, we will post structured notifications directly into your channel.'
              },
              {
                q: 'Can I cancel my subscription anytime?',
                a: 'Yes, you can cancel, upgrade, or downgrade your subscription at any point from your billing dashboard. Cancellations will take effect at the end of your current monthly cycle.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="faq-card card card-elevated">
                <h4 className="heading faq-question">{faq.q}</h4>
                <p className="body-sm text-secondary faq-answer">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
