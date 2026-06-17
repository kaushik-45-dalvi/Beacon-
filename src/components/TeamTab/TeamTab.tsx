import { CertCheckResult } from '../../types';
import { useState } from 'react';
import {
  Users, Bell, Play, X, MessageSquare, Check, Eye, UserPlus, Info,
  Mail, Send, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import './TeamTab.css';

interface Props {
  result: CertCheckResult;
}

type SendState = 'idle' | 'sending' | 'success' | 'error';

export default function TeamTab({ result }: Props) {
  const [slackAlertState, setSlackAlertState] = useState<'idle' | 'showing' | 'snoozed' | 'done'>('idle');
  const [alertEmail, setAlertEmail]           = useState('');
  const [sendState, setSendState]             = useState<SendState>('idle');
  const [sendError, setSendError]             = useState('');

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

  // Derived from real cert data
  const urgencyEmoji = result.daysRemaining <= 7  ? '🚨' : result.daysRemaining <= 30 ? '⚠️' : '✅';
  const urgencyLabel = result.daysRemaining <= 7  ? 'CRITICAL'
                     : result.daysRemaining <= 30 ? 'WARNING'
                     : 'VALID';
  const urgencyClass = result.daysRemaining <= 7  ? 'text-red'
                     : result.daysRemaining <= 30 ? 'text-yellow'
                     : 'text-green';

  const handleSendEmail = async () => {
    const trimmed = alertEmail.trim();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setSendError('Please enter a valid email address.');
      return;
    }

    setSendState('sending');
    setSendError('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          email:         trimmed,
          domain:        result.domain,
          daysRemaining: result.daysRemaining,
          issuer:        result.issuerOrg || result.issuer,
          expiresAt:     result.expiresAt,
          status:        result.status,
          keyType:       result.keyType,
          keySize:       result.keySize,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');

      setSendState('success');
      // Auto-reset after 5 seconds
      setTimeout(() => setSendState('idle'), 5000);
    } catch (err: any) {
      setSendError(err.message || 'Something went wrong.');
      setSendState('error');
    }
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendEmail();
  };

  return (
    <div className="team-tab animate-fade-in">
      <div className="team-grid">
        {/* Panel 1: Team & Collaboration */}
        <div className="team-panel card card-elevated">
          <div className="panel-header">
            <Users className="panel-icon text-accent" size={20} />
            <h3 className="heading">Team Collaboration</h3>
          </div>
          <p className="body-sm text-secondary mb-4">
            Manage who receives certificate monitoring alerts for{' '}
            <span className="mono text-primary">{result.domain}</span>.
          </p>

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
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 4 }} disabled title="Available on Pro plan">
              <UserPlus size={13} /> Invite Team Member
            </button>
            <p className="label text-tertiary" style={{ marginTop: -4 }}>Team collaboration is available on the Pro plan.</p>
          </div>
        </div>

        {/* Panel 2: Activity Logs */}
        <div className="team-panel card card-elevated">
          <div className="panel-header">
            <Eye className="panel-icon text-accent" size={20} />
            <h3 className="heading">Activity & Audit Logs</h3>
          </div>
          <p className="body-sm text-secondary mb-4">
            A continuous audit trail of changes made to{' '}
            <span className="mono text-primary">{result.domain}</span> monitoring.
          </p>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px', marginBottom: 12
          }}>
            <Info size={16} className="text-accent" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p className="body-sm text-primary font-semibold">Audit log is per-user</p>
              <p className="body-sm text-secondary mt-1">
                Activity logs track who added, modified or refreshed domain monitoring in your account.
              </p>
            </div>
          </div>

          <div className="audit-list">
            <div className="audit-item body-sm">
              <div className="audit-time label text-tertiary text-xs">Now</div>
              <div className="audit-text">
                <strong className="text-primary">Certificate checked</strong> —{' '}
                <span className="mono">{result.domain}</span> expires in{' '}
                <strong className={urgencyClass}>{result.daysRemaining} days</strong>
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

      {/* ── Alert Simulator Card ─────────────────────────────────── */}
      <div className="simulator-card card card-elevated mt-6">
        <div className="simulator-header">
          <Bell className="simulator-icon text-accent" size={24} />
          <div>
            <h4 className="heading">Alert Simulator & Email Notification</h4>
            <p className="body-sm text-secondary">
              Preview the Slack alert or send a real email using{' '}
              <span className="mono text-primary">{result.domain}</span>'s live certificate data
            </p>
          </div>
        </div>

        <div className="simulator-content mt-4">
          {/* ── Email input section ── */}
          <div className="alert-email-section">
            <label className="label text-secondary" htmlFor="alert-email-input" style={{ display: 'block', marginBottom: 8 }}>
              <Mail size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              Send a real alert email to:
            </label>

            <div className="alert-email-row">
              <input
                id="alert-email-input"
                type="email"
                className="input alert-email-input"
                placeholder="you@example.com"
                value={alertEmail}
                onChange={e => { setAlertEmail(e.target.value); setSendState('idle'); setSendError(''); }}
                onKeyDown={handleEmailKeyDown}
                disabled={sendState === 'sending'}
              />
              <button
                id="btn-send-alert-email"
                className={`btn alert-send-btn ${sendState === 'success' ? 'btn-success' : 'btn-primary'}`}
                onClick={handleSendEmail}
                disabled={!alertEmail.trim() || sendState === 'sending' || sendState === 'success'}
              >
                {sendState === 'sending' ? (
                  <><Loader2 size={14} className="spin" /> Sending…</>
                ) : sendState === 'success' ? (
                  <><CheckCircle2 size={14} /> Sent!</>
                ) : (
                  <><Send size={14} /> Send Alert</>
                )}
              </button>
            </div>

            {/* Status messages */}
            {sendState === 'success' && (
              <div className="alert-feedback alert-feedback-success">
                <CheckCircle2 size={14} />
                <span>Alert email sent to <strong>{alertEmail}</strong> — check your inbox (and spam folder).</span>
              </div>
            )}
            {sendState === 'error' && (
              <div className="alert-feedback alert-feedback-error">
                <AlertCircle size={14} />
                <span>{sendError}</span>
              </div>
            )}

            <p className="label text-tertiary mt-2">
              The email contains real certificate details: issuer, expiry date, days remaining, and key info.
            </p>
          </div>

          <div className="simulator-divider">
            <span className="label text-tertiary">or</span>
          </div>

          {/* ── Slack preview button ── */}
          <p className="body-sm text-secondary mb-3">
            Preview the Slack channel notification format:
          </p>
          <button
            id="btn-simulate-slack"
            className="btn btn-secondary"
            onClick={triggerSlackSimulation}
            disabled={slackAlertState !== 'idle'}
          >
            <Play size={14} /> Preview Slack Alert
          </button>
        </div>
      </div>

      {/* ── Floating Slack Bubble ── */}
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
                    <strong className={urgencyClass}>
                      {result.daysRemaining} day{result.daysRemaining !== 1 ? 's' : ''}
                    </strong>.
                  </div>
                  <div className="slack-meta-info mt-2">
                    <div><strong>Issuer:</strong> {result.issuerOrg}</div>
                    <div><strong>Expires:</strong> {new Date(result.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div><strong>Key:</strong> {result.keyType} {result.keySize}-bit</div>
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
                  <Check size={16} /> Snoozed for 24 hours.
                </div>
              )}
              {slackAlertState === 'done' && (
                <div className="slack-feedback text-green font-semibold flex items-center gap-2">
                  <Check size={16} /> Marked as renewed!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
