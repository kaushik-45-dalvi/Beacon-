import { CertCheckResult } from '../../types';
import { useState } from 'react';
import { Code, Copy, Terminal, Link, Check, ExternalLink } from 'lucide-react';
import './ApiTab.css';

interface Props {
  result: CertCheckResult;
}

export default function ApiTab({ result }: Props) {
  const [copiedType, setCopiedType] = useState<'curl' | 'js' | 'json' | null>(null);

  const domain = result.domain;
  
  const apiResponse = {
    domain: domain,
    issuer: result.issuer,
    issuer_org: result.issuerOrg,
    subject: result.subject,
    issued_at: result.issuedAt,
    expires_at: result.expiresAt,
    days_remaining: result.daysRemaining,
    status: result.status === 'green' ? 'valid' : result.status === 'yellow' ? 'expiring_soon' : 'critical',
    ocsp_status: result.ocspStatus,
    key: {
      type: result.keyType,
      size: result.keySize,
      signature_algorithm: result.signatureAlgorithm,
      serial_number: result.serialNumber,
      fingerprint_sha256: result.fingerprintSha256
    },
    san_domains: result.sanDomains
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

  const curlCode = `curl -X GET "${supabaseUrl}/functions/v1/check-domain?domain=${domain}" \\
  -H "Authorization: Bearer ${supabaseAnonKey}"`;

  const jsCode = `// Fetch certificate information programmatically
fetch('${supabaseUrl}/functions/v1/check-domain?domain=${domain}', {
  headers: {
    'Authorization': 'Bearer ${supabaseAnonKey}'
  }
})
.then(res => res.json())
.then(data => {
  console.log(\`Days remaining: \${data.daysRemaining}\`);
  if (data.daysRemaining < 30) {
    console.warn('Action required: Certificate expiring soon!');
  }
});`;

  const handleCopy = (text: string, type: 'curl' | 'js' | 'json') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="api-tab animate-fade-in">
      <div className="api-grid">
        {/* Left: Code Snippets & Docs */}
        <div className="api-panel card card-elevated">
          <div className="panel-header">
            <Terminal className="panel-icon text-accent" size={20} />
            <h3 className="heading">API & CLI Integration</h3>
          </div>
          <p className="body-sm text-secondary mb-4">
            Automate certificate monitoring using our developer API in your CI/CD pipelines or alerts scripts.
          </p>

          {/* cURL */}
          <div className="code-block-wrap">
            <div className="code-header">
              <span className="label text-secondary text-xs">cURL request</span>
              <button 
                className="btn-copy-code" 
                onClick={() => handleCopy(curlCode, 'curl')}
                aria-label="Copy cURL command"
              >
                {copiedType === 'curl' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
              </button>
            </div>
            <pre className="code-pre mono">{curlCode}</pre>
          </div>

          {/* JavaScript */}
          <div className="code-block-wrap mt-4">
            <div className="code-header">
              <span className="label text-secondary text-xs">JavaScript (Fetch)</span>
              <button 
                className="btn-copy-code" 
                onClick={() => handleCopy(jsCode, 'js')}
                aria-label="Copy JavaScript snippet"
              >
                {copiedType === 'js' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
              </button>
            </div>
            <pre className="code-pre mono">{jsCode}</pre>
          </div>
        </div>

        {/* Right: Sandbox Response JSON */}
        <div className="api-panel card card-elevated">
          <div className="panel-header">
            <Code className="panel-icon text-accent" size={20} />
            <h3 className="heading">Live Sandbox Response</h3>
          </div>
          <p className="body-sm text-secondary mb-4">
            Example JSON payload returned by requesting certificate details for this domain.
          </p>

          <div className="json-block-wrap">
            <div className="code-header">
              <span className="label text-secondary text-xs">JSON Response (GET 200 OK)</span>
              <button 
                className="btn-copy-code" 
                onClick={() => handleCopy(JSON.stringify(apiResponse, null, 2), 'json')}
                aria-label="Copy JSON payload"
              >
                {copiedType === 'json' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
              </button>
            </div>
            <pre className="code-pre json-pre mono">{JSON.stringify(apiResponse, null, 2)}</pre>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="integrations-card card card-elevated mt-6">
        <div className="trend-header">
          <Link className="trend-icon text-accent" size={24} />
          <div>
            <h4 className="heading">Third-Party Integrations</h4>
            <p className="body-sm text-secondary">Connect certificate monitoring with DevOps platforms</p>
          </div>
        </div>

        <div className="integrations-grid-container mt-4">
          <div className="integration-box">
            <strong className="body-sm">GitHub Actions</strong>
            <p className="body-sm text-secondary mt-1">Fail build if certificate is expiring in less than 14 days.</p>
            <a href="#github-actions" className="integration-link label mt-2 text-accent">Docs <ExternalLink size={10} /></a>
          </div>
          <div className="integration-box">
            <strong className="body-sm">PagerDuty</strong>
            <p className="body-sm text-secondary mt-1">Create incident tickets automatically when revocation is detected.</p>
            <a href="#pagerduty" className="integration-link label mt-2 text-accent">Docs <ExternalLink size={10} /></a>
          </div>
          <div className="integration-box">
            <strong className="body-sm">Datadog & Webhooks</strong>
            <p className="body-sm text-secondary mt-1">Send metric values for days remaining straight to dashboards.</p>
            <a href="#datadog" className="integration-link label mt-2 text-accent">Docs <ExternalLink size={10} /></a>
          </div>
        </div>
      </div>
    </div>
  );
}
