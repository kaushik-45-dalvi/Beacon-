import { CertCheckResult } from '../../types';
import { useState } from 'react';
import {
  Users, Bell, X, MessageSquare, Check, Eye, UserPlus, Info,
  Mail, Send, Loader2, AlertCircle, CheckCircle2, Hash, ExternalLink
} from 'lucide-react';
import './TeamTab.css';

interface Props {
  result: CertCheckResult;
}

type SendState = 'idle' | 'sending' | 'success' | 'error';

export default function TeamTab({ result }: Props) {
  // Email state
  const [alertEmail,    setAlertEmail]    = useState('');
  const [emailState,    setEmailState]    = useState<SendState>('idle');
  const [emailError,    setEmailError]    = useState('');

  // Slack state
  const [slackWebhook,  setSlackWebhook]  = useState('');
  const [slackState,    setSlackState]    = useState<SendState>('idle');
  const [slackError,    setSlackError]    = useState('');

  // Slack preview bubble
  const [showPreview,   setShowPreview]   = useState<'idle' | 'showing' | 'snoozed' | 'done'>('idle');

  // Derived from real cert data
  const urgencyEmoji = result.daysRemaining <= 7  ? '🚨' : result.daysRemaining <= 30 ? '⚠️' : '✅';
  const urgencyLabel = result.daysRemaining <= 7  ? 'CRITICAL'
                     : result.daysRemaining <= 30 ? 'WARNING'
                     : 'VALID';
  const urgencyClass = result.daysRemaining <= 7  ? 'text-red'
                     : result.daysRemaining <= 30 ? 'text-yellow'
                     : 'text-green';

  const formattedExpiry = new Date(result.expiresAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // ── Send real email ──────────────────────────────────
  const handleSendEmail = async () => {
    const trimmed = alertEmail.trim();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailState('sending');
    setEmailError('');
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
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
      setEmailState('success');
      setTimeout(() => setEmailState('idle'), 5000);
    } catch (err: any) {
      setEmailError(err.message || 'Something went wrong.');
      setEmailState('error');
    }
  };

  // ── Send real Slack message ──────────────────────────
  const handleSendSlack = async () => {
    const trimmed = slackWebhook.trim();
    if (!trimmed) return;
    setSlackState('sending');
    setSlackError('');
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-slack-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
        body: JSON.stringify({
          webhookUrl:    trimmed,
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
      if (!res.ok) throw new Error(data.error || 'Slack webhook request failed');
      setSlackState('success');
      setTimeout(() => setSlackState('idle'), 5000);
    } catch (err: any) {
      setSlackError(err.message || 'Failed to send Slack message.');
      setSlackState('error');
    }
  };

  return (
    <div className="team-tab animate-fade-in">
      <div className="team-grid">

        {/* ── Panel 1: Team ── */}
        <div className="team-panel card card-elevated">
          <div className="panel-header">
            <Users className="panel-icon text-accent" size={20} />
            <h3 className="heading">Team Collaboration</h3>
          </div>
          <p className="body-sm text-secondary mb-4">
            Manage who receives certificate monitoring alerts for{' '}
            <span className="mono text-primary">{result.domain}</span>.
          </p>
          <div className="team-empty-state">
            <UserPlus size={28} className="text-accent" style={{ opacity: 0.7 }} />
            <div>
              <p className="body-sm text-primary font-semibold">No team members yet</p>
              <p className="body-sm text-secondary mt-1">
                Invite your team to collaborate on certificate monitoring and receive shared alerts.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" disabled title="Available on Pro plan">
              <UserPlus size={13} /> Invite Team Member
            </button>
            <p className="label text-tertiary">Team collaboration is available on the Pro plan.</p>
          </div>
        </div>

        {/* ── Panel 2: Audit Logs ── */}
        <div className="team-panel card card-elevated">
          <div className="panel-header">
            <Eye className="panel-icon text-accent" size={20} />
            <h3 className="heading">Activity & Audit Logs</h3>
          </div>
          <p className="body-sm text-secondary mb-4">
            A live audit trail of certificate events for{' '}
            <span className="mono text-primary">{result.domain}</span>.
          </p>
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
            <div className="audit-item body-sm">
              <div className="audit-time label text-tertiary text-xs">Now</div>
              <div className="audit-text">
                <strong className="text-primary">Issuer</strong> — {result.issuerOrg || result.issuer}
                &nbsp;·&nbsp;<strong>{result.keyType} {result.keySize}-bit</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          ALERT SIMULATOR — two real channels
      ══════════════════════════════════════════════════ */}
      <div className="simulator-card card card-elevated mt-6">
        <div className="simulator-header">
          <Bell className="simulator-icon text-accent" size={24} />
          <div>
            <h4 className="heading">Alert Notifications</h4>
            <p className="body-sm text-secondary">
              Send a real alert — email or Slack — using live data from{' '}
              <span className="mono text-primary">{result.domain}</span>
            </p>
          </div>
        </div>

        {/* Alert preview banner */}
        <div className={`alert-preview-banner alert-banner-${result.status} mt-4`}>
          <span className="alert-preview-emoji">{urgencyEmoji}</span>
          <div>
            <strong>{urgencyLabel}</strong> · {result.domain} expires in{' '}
            <strong className={urgencyClass}>{result.daysRemaining} days</strong>
            <span className="text-secondary"> ({formattedExpiry})</span>
          </div>
        </div>

        <div className="alert-channels-grid mt-5">

          {/* ── Email Channel ── */}
          <div className="alert-channel-card">
            <div className="channel-card-header">
              <div className="channel-icon-wrap channel-icon-email">
                <Mail size={18} />
              </div>
              <div>
                <strong className="body-sm text-primary">Email Alert</strong>
                <p className="label text-secondary">Send a real certificate alert email to anyone</p>
              </div>
            </div>

            {/* Domain setup guide — unlocks sending to any address */}
            <div className="resend-tier-notice resend-setup-guide">
              <AlertCircle size={13} className="resend-tier-icon" />
              <div>
                <strong>To send to any email:</strong> Verify your domain on Resend, then set
                {' '}<code className="resend-code">RESEND_FROM_EMAIL</code> in Supabase secrets to
                {' '}<code className="resend-code">BEACON SSL &lt;alerts@yourdomain.com&gt;</code>.
                {' '}<a
                  href="https://resend.com/domains"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resend-tier-link"
                >Add domain on Resend →</a>
              </div>
            </div>

            <div className="channel-input-row">
              <input
                id="alert-email-input"
                type="email"
                className="input alert-channel-input"
                placeholder="recipient@example.com"
                value={alertEmail}
                onChange={e => { setAlertEmail(e.target.value); setEmailState('idle'); setEmailError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
                disabled={emailState === 'sending'}
              />
              <button
                id="btn-send-alert-email"
                className={`btn channel-send-btn ${emailState === 'success' ? 'btn-channel-success' : 'btn-primary'}`}
                onClick={handleSendEmail}
                disabled={!alertEmail.trim() || emailState === 'sending' || emailState === 'success'}
              >
                {emailState === 'sending' ? <><Loader2 size={14} className="spin" /> Sending…</>
                 : emailState === 'success' ? <><CheckCircle2 size={14} /> Sent!</>
                 : <><Send size={14} /> Send</>}
              </button>
            </div>

            {emailState === 'success' && (
              <div className="channel-feedback channel-feedback-success">
                <CheckCircle2 size={13} />
                Alert email sent to <strong>{alertEmail}</strong> — check your inbox!
              </div>
            )}
            {emailState === 'error' && (
              <div className="channel-feedback channel-feedback-error">
                <AlertCircle size={13} /> {emailError}
              </div>
            )}
          </div>

          {/* ── Slack Channel ── */}
          <div className="alert-channel-card">
            <div className="channel-card-header">
              <div className="channel-icon-wrap channel-icon-slack">
                <Hash size={18} />
              </div>
              <div>
                <strong className="body-sm text-primary">Slack Alert</strong>
                <p className="label text-secondary">Post a real message to your Slack channel</p>
              </div>
            </div>

            <div className="channel-input-row">
              <input
                id="slack-webhook-input"
                type="url"
                className="input alert-channel-input"
                placeholder="https://hooks.slack.com/services/..."
                value={slackWebhook}
                onChange={e => { setSlackWebhook(e.target.value); setSlackState('idle'); setSlackError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSendSlack()}
                disabled={slackState === 'sending'}
              />
              <button
                id="btn-send-slack-alert"
                className={`btn channel-send-btn ${slackState === 'success' ? 'btn-channel-success' : 'btn-slack'}`}
                onClick={handleSendSlack}
                disabled={!slackWebhook.trim() || slackState === 'sending' || slackState === 'success'}
              >
                {slackState === 'sending' ? <><Loader2 size={14} className="spin" /> Sending…</>
                 : slackState === 'success' ? <><CheckCircle2 size={14} /> Sent!</>
                 : <><MessageSquare size={14} /> Send</>}
              </button>
            </div>

            {slackState === 'success' && (
              <div className="channel-feedback channel-feedback-success">
                <CheckCircle2 size={13} />
                Slack message sent to your channel!
              </div>
            )}
            {slackState === 'error' && (
              <div className="channel-feedback channel-feedback-error">
                <AlertCircle size={13} /> {slackError}
              </div>
            )}
            <p className="label text-tertiary mt-2" style={{ fontSize: 11 }}>
              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
              >
                How to get a Slack webhook URL <ExternalLink size={10} />
              </a>
            </p>
          </div>
        </div>

        {/* ── Slack Visual Preview ── */}
        <div className="preview-section mt-5">
          <div className="preview-section-label label text-tertiary">
            <MessageSquare size={12} /> Preview what the Slack message looks like
          </div>
          <button
            id="btn-preview-slack"
            className="btn btn-ghost btn-sm mt-2"
            onClick={() => setShowPreview('showing')}
            disabled={showPreview !== 'idle'}
          >
            Show Slack Preview
          </button>
        </div>
      </div>

      {/* ── Floating Slack Preview Bubble ── */}
      {showPreview !== 'idle' && (
        <div className="slack-overlay-container">
          <div className="slack-bubble animate-slide-right">
            <div className="slack-bubble-header">
              <div className="slack-brand">
                <MessageSquare size={14} className="slack-logo-icon" />
                <span className="slack-title font-semibold">Slack · #cert-alerts</span>
              </div>
              <button className="slack-close-btn" onClick={() => setShowPreview('idle')}>
                <X size={12} />
              </button>
            </div>
            <div className="slack-bubble-body">
              {showPreview === 'showing' && (
                <>
                  <div className="slack-alert-headline font-semibold">
                    {urgencyEmoji} Certificate {urgencyLabel === 'VALID' ? 'Status Update' : 'Expiring Soon!'}
                  </div>
                  <div className="slack-alert-text mt-1 body-sm">
                    SSL cert for <span className="mono font-semibold">{result.domain}</span> expires in{' '}
                    <strong className={urgencyClass}>{result.daysRemaining} day{result.daysRemaining !== 1 ? 's' : ''}</strong>.
                  </div>
                  <div className="slack-meta-info mt-2">
                    <div><strong>Issuer:</strong> {result.issuerOrg}</div>
                    <div><strong>Expires:</strong> {formattedExpiry}</div>
                    <div><strong>Key:</strong> {result.keyType} {result.keySize}-bit</div>
                    <div><strong>Severity:</strong> {urgencyLabel}</div>
                  </div>
                  <div className="slack-actions-row mt-3">
                    <button className="slack-btn slack-btn-primary" onClick={() => setShowPreview('idle')}>
                      View in Beacon
                    </button>
                    <button className="slack-btn" onClick={() => { setShowPreview('snoozed'); setTimeout(() => setShowPreview('idle'), 2500); }}>
                      Snooze 24h
                    </button>
                    <button className="slack-btn slack-btn-success" onClick={() => { setShowPreview('done'); setTimeout(() => setShowPreview('idle'), 2500); }}>
                      <Check size={12} /> Mark Done
                    </button>
                  </div>
                </>
              )}
              {showPreview === 'snoozed' && (
                <div className="slack-feedback text-yellow font-semibold">
                  <Check size={16} /> Snoozed for 24 hours.
                </div>
              )}
              {showPreview === 'done' && (
                <div className="slack-feedback text-green font-semibold">
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
