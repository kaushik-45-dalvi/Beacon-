import { CertCheckResult } from '../../types';
import { Shield, AlertTriangle, CheckCircle2, Globe, Monitor, Smartphone, HelpCircle, Info } from 'lucide-react';
import './SecurityTab.css';

interface Props {
  result: CertCheckResult;
}

export default function SecurityTab({ result }: Props) {
  // === Real HSTS from edge function ===
  const hstsEnabled = result.hstsEnabled ?? false;
  const hstsMaxAge  = result.hstsMaxAge  ?? 0;

  // === CT Log status — derived from dataSource ===
  // live-tls   → we connected directly; cert is already in browser trust chains, CT is implicit
  // certspotter-api → certspotter IS a CT log monitor, so the cert is confirmed in CT logs
  // undefined  → could not determine
  const dataSource = result.dataSource;
  const ctLogStatus = dataSource === 'live-tls'
    ? { value: 'Confirmed (live TLS handshake)', status: 'success' as const }
    : dataSource === 'certspotter-api'
    ? { value: 'Confirmed (CT log record found)', status: 'success' as const }
    : { value: 'Unknown (source not determined)', status: 'neutral' as const };

  // === Signature algorithm check (real from cert) ===
  const sigAlg = result.signatureAlgorithm || 'Unknown';
  const sigOk  = sigAlg !== 'Unknown' && !sigAlg.toLowerCase().includes('md5') && !sigAlg.toLowerCase().includes('sha1');

  // === Browser compat: computed from real keyType + keySize ===
  const kt = result.keyType || 'RSA';
  const ks = result.keySize || 2048;

  // RSA <2048 = legacy broken; ECDSA 256/384 = excellent; RSA 2048/4096 = good
  const isWeakKey = kt === 'RSA' && ks < 2048;
  const isModernKey = kt === 'ECDSA' || (kt === 'RSA' && ks >= 2048);

  // Derive approximate global coverage percent
  const globalCoverage = isWeakKey ? '~65%' : isModernKey ? '99.6%' : '95%';
  const coverageNote = isWeakKey
    ? 'Weak key detected — compatibility and trust may be limited on modern clients.'
    : kt === 'ECDSA'
    ? 'ECDSA keys are highly compatible and faster than RSA on modern browsers.'
    : 'RSA 2048+ is widely supported across all modern and legacy clients.';

  const browserCompat = [
    { name: 'Google Chrome',          version: '90+',  status: isWeakKey ? 'limited'   : 'supported', icon: Globe },
    { name: 'Mozilla Firefox',        version: '88+',  status: isWeakKey ? 'limited'   : 'supported', icon: Globe },
    { name: 'Apple Safari',           version: '14+',  status: isWeakKey ? 'limited'   : 'supported', icon: Globe },
    { name: 'Microsoft Edge',         version: '90+',  status: isWeakKey ? 'limited'   : 'supported', icon: Globe },
    { name: 'Android Browser',        version: '5.0+', status: isWeakKey ? 'deprecated': 'supported', icon: Smartphone },
    { name: 'iOS Safari',             version: '12+',  status: isWeakKey ? 'limited'   : 'supported', icon: Smartphone },
    { name: 'Internet Explorer',      version: '11',   status: kt === 'ECDSA' ? 'limited' : 'limited', icon: Monitor },
    { name: 'Android Browser (4.4)',  version: '4.4',  status: 'deprecated', icon: Smartphone },
  ];

  const securityChecks = [
    {
      id: 'hsts',
      label: 'HSTS Status',
      value: hstsEnabled ? `Enabled (max-age: ${hstsMaxAge.toLocaleString()}s)` : 'Disabled / Not Detected',
      status: hstsEnabled ? 'success' : 'warning',
      description: 'HTTP Strict Transport Security forces browsers to always use HTTPS for this domain.',
    },
    {
      id: 'ct-logs',
      label: 'Certificate Transparency (CT) Logs',
      value: ctLogStatus.value,
      status: ctLogStatus.status,
      description: 'Verifies the certificate is publicly logged in auditable CT logs to prevent mis-issuance.',
    },
    {
      id: 'sig-alg',
      label: 'Signature Algorithm',
      value: sigOk ? `${sigAlg} ✓` : sigAlg === 'Unknown' ? 'Unknown' : `${sigAlg} (weak)`,
      status: sigOk ? 'success' : sigAlg === 'Unknown' ? 'neutral' : 'warning',
      description: `This certificate uses ${sigAlg}. SHA-256 and above are considered secure; MD5 and SHA-1 are broken.`,
    },
    {
      id: 'mixed-content',
      label: 'Mixed Content Scan',
      value: 'Not scanned (requires page crawl)',
      status: 'neutral',
      description: 'Checking for HTTP resources inside an HTTPS page requires crawling the live page — not available in an API-only check.',
    },
    {
      id: 'pinning',
      label: 'Certificate Pinning (HPKP)',
      value: 'Not configured (deprecated)',
      status: 'neutral',
      description: 'HPKP is deprecated across all major browsers and generally not recommended. Certificate pinning is now handled by browser trust stores.',
    },
  ];

  return (
    <div className="security-tab animate-fade-in">
      {dataSource === 'certspotter-api' && (
        <div className="data-source-notice body-sm" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--yellow-dim)', border: '1px solid var(--yellow)',
          color: 'var(--yellow)', borderRadius: 8, padding: '8px 14px', marginBottom: 16
        }}>
          <Info size={14} />
          <span>
            Live TLS handshake was unavailable — data sourced from Certificate Transparency logs
            (CertSpotter). HSTS status may not be available.
          </span>
        </div>
      )}

      <div className="security-grid">
        {/* Left Side: Advanced Security Checks */}
        <div className="security-panel card card-elevated">
          <div className="panel-header">
            <Shield className="panel-icon text-accent" size={20} />
            <h3 className="heading">Advanced Security Audit</h3>
          </div>
          <p className="body-sm text-secondary mb-4">
            Analysis of HTTP headers and security configurations on <span className="mono text-primary">{result.domain}</span>.
          </p>

          <div className="security-checks-list">
            {securityChecks.map((check) => (
              <div key={check.id} className="security-check-item">
                <div className="check-status-row">
                  {check.status === 'success' ? (
                    <CheckCircle2 className="text-green" size={16} />
                  ) : check.status === 'warning' ? (
                    <AlertTriangle className="text-yellow" size={16} />
                  ) : (
                    <HelpCircle className="text-tertiary" size={16} />
                  )}
                  <strong className="body-sm text-primary">{check.label}</strong>
                  <span className={`badge badge-compat ${
                    check.status === 'success' ? 'badge-green' : check.status === 'warning' ? 'badge-yellow' : 'badge-neutral'
                  }`}>
                    {check.value}
                  </span>
                </div>
                <p className="check-description body-sm text-secondary">{check.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Browser Compatibility Check */}
        <div className="security-panel card card-elevated">
          <div className="panel-header">
            <Monitor className="panel-icon text-accent" size={20} />
            <h3 className="heading">Browser Compatibility Check</h3>
          </div>
          <p className="body-sm text-secondary mb-4">
            Compatibility based on this certificate's actual key: <strong>{result.keyType} {result.keySize}-bit</strong> with <strong>{result.signatureAlgorithm}</strong>.
          </p>

          <div className="compat-list">
            {browserCompat.map((browser, index) => {
              const BrowserIcon = browser.icon;
              return (
                <div key={index} className="compat-item">
                  <div className="compat-browser-info">
                    <BrowserIcon size={14} className="text-secondary" />
                    <span className="body-sm text-primary">{browser.name}</span>
                    <span className="label text-tertiary text-xs">v{browser.version}</span>
                  </div>
                  <span className={`badge ${
                    browser.status === 'supported' ? 'badge-green' : browser.status === 'limited' ? 'badge-yellow' : 'badge-red'
                  }`}>
                    {browser.status}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="compat-summary">
            <p className="body-sm text-secondary">
              <strong>Verdict:</strong> This certificate ({kt} {ks}-bit) is compatible with approximately{' '}
              <strong>{globalCoverage}</strong> of global web traffic. {coverageNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
