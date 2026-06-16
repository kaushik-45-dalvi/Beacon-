import { CertCheckResult } from '../../types';
import { formatDate } from '../../services/certService';
import {
  Shield, ShieldAlert, ShieldX, Calendar, Key, Globe,
  Copy, Download, CheckCircle2, AlertTriangle, XCircle, Clock
} from 'lucide-react';
import { useState } from 'react';
import ChainVisualizer from '../ChainVisualizer/ChainVisualizer';
import SANGrid from '../SANGrid/SANGrid';
import ExpiryTimeline from '../ExpiryTimeline/ExpiryTimeline';
import SecurityTab from '../SecurityTab/SecurityTab';
import HistoryTab from '../HistoryTab/HistoryTab';
import ApiTab from '../ApiTab/ApiTab';
import TeamTab from '../TeamTab/TeamTab';
import './CertResult.css';

interface Props {
  result: CertCheckResult;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'green') return <CheckCircle2 size={20} className="text-green" />;
  if (status === 'yellow') return <AlertTriangle size={20} className="text-yellow" />;
  return <XCircle size={20} className="text-red" />;
}

function OcspBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    good:     { label: 'Not Revoked', cls: 'badge-green' },
    revoked:  { label: 'REVOKED',     cls: 'badge-red' },
    unknown:  { label: 'Unknown',     cls: 'badge-neutral' },
  };
  const { label, cls } = map[status] || map.unknown;
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function CertResult({ result }: Props) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'chain' | 'security' | 'history' | 'api' | 'team'>('chain');

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.domain}-cert.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = result.status === 'green' ? 'var(--green)' : result.status === 'yellow' ? 'var(--yellow)' : 'var(--red)';
  const statusLabel = result.status === 'green' ? 'Valid' : result.status === 'yellow' ? 'Expiring Soon' : 'Critical';
  const StatusShield = result.status === 'green' ? Shield : result.status === 'yellow' ? ShieldAlert : ShieldX;

  return (
    <div className="cert-result animate-fade-up">
      {/* Header strip */}
      <div className="cert-result-header" style={{ '--status-color': statusColor } as React.CSSProperties}>
        <div className="cert-status-icon">
          <StatusShield size={32} />
        </div>
        <div className="cert-header-info">
          <div className="cert-domain-row">
            <h2 className="cert-domain heading">{result.domain}</h2>
            <span className={`badge badge-${result.status === 'green' ? 'green' : result.status === 'yellow' ? 'yellow' : 'red'}`}>
              {statusLabel}
            </span>
          </div>
          <p className="cert-issuer text-secondary body-sm">
            Issued by: <strong className="text-primary">{result.issuer}</strong>
          </p>
        </div>

        {/* Big countdown */}
        <div className="cert-countdown">
          <div className="countdown-number" style={{ color: statusColor }}>
            {result.daysRemaining}
          </div>
          <div className="countdown-label label text-secondary">
            {result.daysRemaining === 1 ? 'day left' : 'days left'}
          </div>
        </div>
      </div>

      {/* Expiry Timeline */}
      <ExpiryTimeline
        issuedAt={result.issuedAt}
        expiresAt={result.expiresAt}
        daysRemaining={result.daysRemaining}
        status={result.status}
      />

      {/* Bento grid of cert details */}
      <div className="cert-bento">
        {/* Row 1 */}
        <div className="cert-bento-cell">
          <div className="bento-label label text-secondary">
            <Calendar size={12} /> Issued
          </div>
          <div className="bento-value mono">{formatDate(result.issuedAt)}</div>
        </div>
        <div className="cert-bento-cell">
          <div className="bento-label label text-secondary">
            <Calendar size={12} /> Expires
          </div>
          <div className="bento-value mono" style={{ color: statusColor }}>{formatDate(result.expiresAt)}</div>
        </div>
        <div className="cert-bento-cell">
          <div className="bento-label label text-secondary">
            <Key size={12} /> Key Type
          </div>
          <div className="bento-value">{result.keyType} {result.keySize}-bit</div>
        </div>
        <div className="cert-bento-cell">
          <div className="bento-label label text-secondary">
            <Shield size={12} /> OCSP Status
          </div>
          <div className="bento-value"><OcspBadge status={result.ocspStatus} /></div>
        </div>

        {/* Row 2 */}
        <div className="cert-bento-cell cert-bento-wide">
          <div className="bento-label label text-secondary">Serial Number</div>
          <div className="bento-value mono body-sm">{result.serialNumber}</div>
        </div>
        <div className="cert-bento-cell">
          <div className="bento-label label text-secondary">
            <Globe size={12} /> Chain
          </div>
          <div className="bento-value">
            {result.chainComplete ? (
              <span className="badge badge-green">Complete ✓</span>
            ) : (
              <span className="badge badge-yellow">Incomplete ⚠</span>
            )}
          </div>
        </div>
        <div className="cert-bento-cell">
          <div className="bento-label label text-secondary">Signature Algo</div>
          <div className="bento-value body-sm">{result.signatureAlgorithm}</div>
        </div>

        {/* Fingerprint - full width */}
        <div className="cert-bento-cell cert-bento-full">
          <div className="bento-label label text-secondary">SHA-256 Fingerprint</div>
          <div className="bento-value mono body-sm fingerprint">{result.fingerprintSha256}</div>
        </div>
      </div>

      {/* Dynamic Tabs Section */}
      <div className="cert-tabs-section mt-8">
        <div className="cert-tabs-nav">
          <button 
            className={`cert-tab-btn ${activeTab === 'chain' ? 'active' : ''}`}
            onClick={() => setActiveTab('chain')}
            id="tab-btn-chain"
          >
            Certificate Chain
          </button>
          <button 
            className={`cert-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
            id="tab-btn-security"
          >
            Security & Compatibility
          </button>
          <button 
            className={`cert-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            id="tab-btn-history"
          >
            History & Comparison
          </button>
          <button 
            className={`cert-tab-btn ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
            id="tab-btn-api"
          >
            API & Sandbox
          </button>
          <button 
            className={`cert-tab-btn ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
            id="tab-btn-team"
          >
            Team & Alerts
          </button>
        </div>

        <div className="cert-tab-content cert-section">
          {activeTab === 'chain' && result.chain && (
            <div>
              <h3 className="cert-section-title heading">Certificate Chain</h3>
              <ChainVisualizer chain={result.chain} />
            </div>
          )}
          {activeTab === 'security' && <SecurityTab result={result} />}
          {activeTab === 'history' && <HistoryTab result={result} />}
          {activeTab === 'api' && <ApiTab result={result} />}
          {activeTab === 'team' && <TeamTab result={result} />}
        </div>
      </div>

      {/* SAN Domains */}
      {result.sanDomains && result.sanDomains.length > 0 && (
        <div className="cert-section">
          <h3 className="cert-section-title heading">
            Subject Alternative Names
            <span className="section-count label">{result.sanDomains.length}</span>
          </h3>
          <SANGrid domains={result.sanDomains} />
        </div>
      )}

      {/* Warnings */}
      {!result.chainComplete && (
        <div className="cert-warning">
          <AlertTriangle size={16} />
          <div>
            <strong>Incomplete Certificate Chain</strong>
            <p className="body-sm text-secondary">
              Your server may not be sending all intermediate certificates. This can cause browser warnings for some users.
            </p>
          </div>
        </div>
      )}
      {result.ocspStatus === 'revoked' && (
        <div className="cert-critical">
          <XCircle size={16} />
          <div>
            <strong>Certificate is Revoked</strong>
            <p className="body-sm">This certificate has been revoked by the issuing CA. Update immediately.</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="cert-actions">
        <button id="btn-copy-cert" className="btn btn-secondary" onClick={handleCopy}>
          <Copy size={14} />
          {copied ? 'Copied!' : 'Copy Details'}
        </button>
        <button id="btn-download-cert" className="btn btn-secondary" onClick={handleDownload}>
          <Download size={14} />
          Download JSON
        </button>
        <div className="cert-actions-right">
          <span className="label text-tertiary flex items-center gap-2">
            <Clock size={12} /> Checked just now
          </span>
        </div>
      </div>
    </div>
  );
}
