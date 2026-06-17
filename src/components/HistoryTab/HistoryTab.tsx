import { CertCheckResult } from '../../types';
import { formatDate } from '../../services/certService';
import { Calendar, Clock, GitCompare, TrendingUp, CheckCircle, ArrowRight, Info } from 'lucide-react';
import './HistoryTab.css';

interface Props {
  result: CertCheckResult;
}

export default function HistoryTab({ result }: Props) {
  const currentIssued  = new Date(result.issuedAt);
  const currentExpires = new Date(result.expiresAt);

  // Actual validity duration in days (real data)
  const validityMs   = currentExpires.getTime() - currentIssued.getTime();
  const validityDays = Math.round(validityMs / (1000 * 60 * 60 * 24));

  // Renewal pattern label derived from actual validity window
  let patternLabel: string;
  let patternSub: string;
  if (validityDays <= 45) {
    patternLabel = 'Short-term / trial certificate';
    patternSub   = `${validityDays}-day validity — short-lived certificate pattern detected.`;
  } else if (validityDays <= 100) {
    patternLabel = 'Auto-renew every 90 days';
    patternSub   = "Let's Encrypt / Google Trust Services pattern — 90-day auto-renewal.";
  } else if (validityDays <= 400) {
    patternLabel = 'Annual renewal (~1 year)';
    patternSub   = `${validityDays}-day validity — standard commercial CA annual certificate.`;
  } else {
    patternLabel = 'Multi-year certificate';
    patternSub   = `${validityDays}-day validity — long-life certificate (${Math.round(validityDays / 365)} years).`;
  }

  // Real history from edge function
  const history    = result.history ?? [];
  const hasHistory = history.length > 0;

  // For comparison: strictly use real history[0] if it exists
  const prevCert = hasHistory ? history[0] : null;

  return (
    <div className="history-tab animate-fade-in">
      <div className="history-grid">
        {/* Panel 1: Certificate Audit History */}
        <div className="history-panel card card-elevated">
          <div className="panel-header">
            <Calendar className="panel-icon text-accent" size={20} />
            <h3 className="heading">Certificate History</h3>
          </div>
          <p className="body-sm text-secondary mb-4">
            Detected certificate issuance logs for <span className="mono text-primary">{result.domain}</span> from Certificate Transparency (CT) logs.
          </p>

          <div className="history-timeline">
            {/* Current Certificate — always real */}
            <div className="history-timeline-item active-item">
              <div className="timeline-marker marker-active" />
              <div className="timeline-content">
                <div className="timeline-title-row">
                  <span className="badge badge-green">Current</span>
                  <span className="timeline-dates mono text-secondary">
                    {formatDate(result.issuedAt)} — {formatDate(result.expiresAt)}
                  </span>
                </div>
                <div className="timeline-details body-sm">
                  <div><strong>Issuer:</strong> {result.issuer}</div>
                  <div><strong>Key:</strong> {result.keyType} {result.keySize}-bit</div>
                  <div className="mono text-tertiary text-xs mt-1">Serial: {result.serialNumber}</div>
                </div>
              </div>
            </div>

            {/* Real historical certs from CT log */}
            {hasHistory ? (
              history.map((hCert, idx) => (
                <div key={idx} className="history-timeline-item">
                  <div className="timeline-marker" />
                  <div className="timeline-content">
                    <div className="timeline-title-row">
                      <span className="badge badge-neutral">
                        {new Date(hCert.expiresAt) >= new Date() ? 'Active (older)' : 'Expired'}
                      </span>
                      <span className="timeline-dates mono text-secondary">
                        {formatDate(hCert.issuedAt)} — {formatDate(hCert.expiresAt)}
                      </span>
                    </div>
                    <div className="timeline-details body-sm text-secondary">
                      <div><strong>Issuer:</strong> {hCert.issuer}</div>
                      <div className="mono text-tertiary text-xs mt-1">Serial: {hCert.serialNumber}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              /* Empty state — no fabricated data */
              <div className="history-empty-state" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 8, padding: '24px 16px', textAlign: 'center',
                background: 'var(--surface-2)', borderRadius: 10, marginTop: 12
              }}>
                <Info size={20} className="text-tertiary" />
                <p className="body-sm text-secondary">
                  No prior issuance records found in Certificate Transparency logs for this domain.
                  This is common for newly issued certificates or private/internal CAs.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Side-by-Side Comparison */}
        <div className="history-panel card card-elevated">
          <div className="panel-header">
            <GitCompare className="panel-icon text-accent" size={20} />
            <h3 className="heading">Comparison: Old vs New</h3>
          </div>
          <p className="body-sm text-secondary mb-4">
            Highlighting updates between the active certificate and the previous CT log entry.
          </p>

          {prevCert ? (
            <div className="comparison-table text-secondary body-sm">
              <div className="comparison-header-row">
                <div className="comparison-col-prop">Property</div>
                <div className="comparison-col-val">Previous Certificate</div>
                <div className="comparison-col-arrow"></div>
                <div className="comparison-col-val">Current Certificate</div>
              </div>

              <div className="comparison-row">
                <div className="comparison-col-prop font-semibold">Issuer</div>
                <div className="comparison-col-val truncate mono">{prevCert.issuerOrg || prevCert.issuer}</div>
                <div className="comparison-col-arrow"><ArrowRight size={12} /></div>
                <div className="comparison-col-val text-primary truncate mono font-semibold">{result.issuerOrg}</div>
              </div>

              <div className="comparison-row val-changed">
                <div className="comparison-col-prop font-semibold">Expires</div>
                <div className="comparison-col-val truncate line-through">{formatDate(prevCert.expiresAt)}</div>
                <div className="comparison-col-arrow"><ArrowRight size={12} /></div>
                <div className="comparison-col-val text-green font-semibold truncate">{formatDate(result.expiresAt)}</div>
              </div>

              <div className="comparison-row val-changed">
                <div className="comparison-col-prop font-semibold">Issued</div>
                <div className="comparison-col-val truncate">{formatDate(prevCert.issuedAt)}</div>
                <div className="comparison-col-arrow"><ArrowRight size={12} /></div>
                <div className="comparison-col-val text-primary font-semibold truncate">{formatDate(result.issuedAt)}</div>
              </div>

              <div className="comparison-row val-changed">
                <div className="comparison-col-prop font-semibold">Serial No.</div>
                <div className="comparison-col-val truncate mono">{prevCert.serialNumber.slice(0, 11)}...</div>
                <div className="comparison-col-arrow"><ArrowRight size={12} /></div>
                <div className="comparison-col-val text-primary truncate mono">{result.serialNumber.slice(0, 11)}...</div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 8, padding: '32px 16px', textAlign: 'center',
              background: 'var(--surface-2)', borderRadius: 10
            }}>
              <GitCompare size={24} className="text-tertiary" />
              <p className="body-sm text-secondary">
                No previous certificate data available to compare.
                A comparison will appear here once a prior issuance record is found.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expiry Trend Analysis — always real */}
      <div className="trend-card card card-elevated mt-6">
        <div className="trend-header">
          <TrendingUp className="trend-icon text-accent" size={24} />
          <div>
            <h4 className="heading">Renewal Expiry Trend Analysis</h4>
            <p className="body-sm text-secondary">Computed from actual certificate validity window</p>
          </div>
        </div>

        <div className="trend-stats-row">
          <div className="trend-stat-box">
            <span className="label text-secondary">Validity Duration</span>
            <div className="trend-stat-val text-primary">{validityDays} days</div>
            <p className="body-sm text-secondary mt-1">{patternLabel}</p>
          </div>
          <div className="trend-stat-box">
            <span className="label text-secondary">Renewal Pattern</span>
            <div className="trend-stat-val text-accent">{patternLabel}</div>
            <p className="body-sm text-secondary mt-1">{patternSub}</p>
          </div>
          <div className="trend-stat-box">
            <span className="label text-secondary">Estimated Next Renewal</span>
            <div className="trend-stat-val text-accent">{formatDate(currentExpires.toISOString())}</div>
            <p className="body-sm text-secondary mt-1">
              {hasHistory
                ? `Based on ${history.length} prior issuance record${history.length > 1 ? 's' : ''}.`
                : 'No prior records — estimate based on current cert only.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
