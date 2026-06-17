import { CertCheckResult } from '../../types';
import { useState } from 'react';
import { Users, Bell, Play, X, MessageSquare, Check, Eye, UserPlus, Info } from 'lucide-react';
import './TeamTab.css';

interface Props {
  result: CertCheckResult;
}

export default function TeamTab({ result }: Props) {
  const [slackAlertState, setSlackAlertState] = useState<'idle' | 'showing' | 'snoozed' | 'done'>('idle');

  const triggerSlackSimulation = () => setSlackAlertState('showing');
  const closeSlackAlert        = () => setSlackAlertState('idle');

  const snoozeAlert = () => {
    setSlackAlertState('snoozed');
    setTimeout(() => setSlackAlertState('idle'), 3000);
  };

  const markAlertDone = () => {
    setSlackAlertState('done');
    setTimeout(() => setSlackAlertState('idle'), 3000);
  };

  // Derive urgency label from real days remaining
  const urgencyEmoji  = result.daysRemaining <= 7  ? '🚨' : result.daysRemaining <= 30 ? '⚠️' : '✅';
  const urgencyLabel  = result.daysRemaining <= 7  ? 'CRITICAL'
                       : result.daysRemaining <= 30 ? 'WARNING'
                       : 'VALID';

  return (
    <div className="team-tab animate-fade-in">
      <div className="team-grid">
        {/* Panel 1: Team & Collaboration — real empty state */}
        <div className="team-panel card card-elevated">
          <div className="panel-header">
            <Users className="panel-icon text-accent" size={20} />
            <h3 className="heading">Team Collaboration</h3>
          </div>
          <p className="body-sm text-secondary mb-4">
            Manage who receives certificate monitoring alerts for <span className="mono text-primary">{result.domain}</span>.
          </p>

          {/* Honest empty state — no fake members */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 12, padding: '28px 16px', textAlign: 'center',
            background: 'var(--surface-2)', borderRadius: 10
          }}>
            <UserPlus size={28} className="text-accent" style={{ opacity: 0.7 }} />
            <div>
              <p className="body-sm text-primary font-semibold">No team members yet</p>
              <p className="body-sm text-secondary mt-1">
                Invite your team to collaborate on certificate monitoring and receive shared alerts.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 4 }} disabled title="Team invite available on Pro plan">
              <UserPlus size={13} /> Invite Team Member
            </button>
            <p className="label text-tertiary" style={{ marginTop: -4 }}>Team collaboration is available on the Pro plan.</p>
          </div>
        </div>

        {/* Panel 2: Activity Logs — real empty state */}
        <div className="team-panel card card-elevated">
          <div className="panel-header">
            <Eye className="panel-icon text-accent" size={20} />
            <h3 className="heading">Activity & Audit Logs</h3>
          </div>
          <p className="body-sm text-secondary mb-4">
            A continuous audit trail of changes made to <span className="mono text-primary">{result.domain}</span> monitoring.
          </p>

          {/* Info about what would appear here + cert-specific real data */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px', marginBottom: 12
          }}>
            <Info size={16} className="text-accent" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p className="body-sm text-primary font-semibold">Audit log is per-user</p>
              <p className="body-sm text-secondary mt-1">
                Activity logs track who added, modified or refreshed domain monitoring in your account.
                Your own actions (like adding <span className="mono">{result.domain}</span>) will appear here once audit logging is enabled on your plan.
              </p>
            </div>
          </div>

          {/* Show real cert facts as a "log-like" display */}
          <div className="audit-list">
            <div className="audit-item body-sm">
              <div className="audit-time label text-tertiary text-xs">Now</div>
              <div className="audit-text">
                <strong className="text-primary">Certificate checked</strong> — {result.issuer} cert for{' '}
                <span className="mono">{result.domain}</span> expires in{' '}
                <strong className={result.daysRemaining <= 7 ? 'text-red' : result.daysRemaining <= 30 ? 'text-yellow' : 'text-green'}>
                  {result.daysRemaining} days
                </strong>
              </div>
            </div>
            {result.dataSource && (
              <div className="audit-item body-sm">
                <div className="audit-time label text-tertiary text-xs">Now</div>
                <div className="audit-text">
                  <strong className="text-primary">Data source</strong> —{' '}
                  {result.dataSource === 'live-tls'
                    ? 'Live TLS handshake with server'
                    : 'Certificate Transparency log (CertSpotter)'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slack Simulator — explicitly a demo feature, not fake data */}
      <div className="simulator-card card card-elevated mt-6">
        <div className="simulator-header">
          <Bell className="simulator-icon text-accent" size={24} />
          <div>
            <h4 className="heading">Slack Integration & Alert Simulator</h4>
            <p className="body-sm text-secondary">Preview what your team would receive — using real data from this certificate</p>
          </div>
        </div>

        <div className="simulator-content mt-4">
          <p className="body-sm text-secondary mb-4">
            Run a simulated Slack alert to preview how BEACON would notify your team about{' '}
            <span className="mono text-primary">{result.domain}</span>. The alert uses real expiry data from this certificate.
          </p>
          <button
            id="btn-simulate-slack"
            className="btn btn-primary"
            onClick={triggerSlackSimulation}
            disabled={slackAlertState !== 'idle'}
          >
            <Play size={14} /> Simulate Slack Alert
          </button>
        </div>
      </div>

      {/* Floating Slack Notification Bubble — uses real result data */}
      {slackAlertState !== 'idle' && (
        <div className="slack-overlay-container">
          <div className="slack-bubble animate-slide-right">
            <div className="slack-bubble-header">
              <div className="slack-brand">
                <MessageSquare size={14} className="slack-logo-icon" />
                <span className="slack-title font-semibold">Slack · #cert-alerts</span>
              </div>
              <button className="slack-close-btn" onClick={closeSlackAlert}>
                <X size={12} />
              </button>
            </div>

            <div className="slack-bubble-body">
              {slackAlertState === 'showing' && (
                <>
                  <div className="slack-alert-headline font-semibold">
                    {urgencyEmoji} Certificate {urgencyLabel === 'VALID' ? 'Status Update' : 'Expiring Soon!'}
                  </div>
                  <div className="slack-alert-text mt-1 body-sm">
                    The SSL certificate for{' '}
                    <span className="mono font-semibold">{result.domain}</span> expires in{' '}
                    <strong className={result.daysRemaining <= 7 ? 'text-red' : result.daysRemaining <= 30 ? 'text-yellow' : 'text-green'}>
                      {result.daysRemaining} day{result.daysRemaining !== 1 ? 's' : ''}
                    </strong>
                    .
                  </div>
                  <div className="slack-meta-info mt-2">
                    <div><strong>Issuer:</strong> {result.issuerOrg}</div>
                    <div><strong>Expires:</strong> {new Date(result.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div><strong>Severity:</strong> {urgencyLabel}</div>
                  </div>
                  <div className="slack-actions-row mt-3">
                    <button className="slack-btn slack-btn-primary" onClick={closeSlackAlert}>
                      View in Beacon
                    </button>
                    <button className="slack-btn" onClick={snoozeAlert}>
                      Snooze 24h
                    </button>
                    <button className="slack-btn slack-btn-success" onClick={markAlertDone}>
                      <Check size={12} /> Mark Done
                    </button>
                  </div>
                </>
              )}

              {slackAlertState === 'snoozed' && (
                <div className="slack-feedback text-yellow font-semibold flex items-center gap-2">
                  <Check size={16} /> Notification snoozed for 24 hours.
                </div>
              )}

              {slackAlertState === 'done' && (
                <div className="slack-feedback text-green font-semibold flex items-center gap-2">
                  <Check size={16} /> Certificate marked as renewed!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
