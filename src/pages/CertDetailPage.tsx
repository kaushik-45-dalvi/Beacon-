import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, RefreshCw, Trash2, Save, CheckCircle2 } from 'lucide-react';
import { MonitoredCert } from '../types';
import CertResult from '../components/CertResult/CertResult';
import { updateSEO } from '../utils/seo';
import { supabase } from '../services/supabaseClient';
import './CertDetailPage.css';

const ALERT_DAYS = [30, 14, 7, 1];
const CHANNELS = ['email', 'slack', 'webhook'] as const;

const mapDbToCert = (row: any): MonitoredCert => {
  return {
    id: row.id,
    domain: row.domain,
    issuer: row.issuer || 'N/A',
    issuerOrg: row.issuer_org || 'N/A',
    subject: row.subject || 'N/A',
    issuedAt: row.issued_at || '',
    expiresAt: row.expires_at || '',
    daysRemaining: row.days_remaining || 0,
    status: row.status || 'red',
    chainComplete: row.chain_complete ?? false,
    ocspStatus: row.ocsp_status || 'unknown',
    keyType: row.key_type || 'N/A',
    keySize: row.key_size || 0,
    signatureAlgorithm: row.signature_algorithm || 'N/A',
    serialNumber: row.serial_number || 'N/A',
    fingerprintSha256: row.fingerprint_sha256 || 'N/A',
    sanDomains: row.san_domains || [],
    chain: row.chain || undefined,
    history: row.history || [],
    lastCheckedAt: row.last_checked_at || new Date().toISOString(),
    alertPreferences: [
      {
        id: `pref-${row.id}`,
        channel: 'email',
        daysBefore: row.alert_days || [30, 7, 1],
        enabled: row.alert_channels && row.alert_channels.length > 0,
        slackWebhookUrl: row.slack_url,
        customWebhookUrl: row.webhook_url
      }
    ]
  };
};

export default function CertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cert, setCert] = useState<MonitoredCert | null>(null);
  const [alertDays, setAlertDays] = useState<number[]>([30, 7, 1]);
  const [alertChannels, setAlertChannels] = useState<string[]>(['email']);
  const [saved, setSaved] = useState(false);
  const [slackUrl, setSlackUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    if (!id) return;
    
    const loadCert = async () => {
      try {
        const { data, error } = await supabase
          .from('monitored_domains')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          const mapped = mapDbToCert(data);
          setCert(mapped);
          setAlertDays(data.alert_days || [30, 7, 1]);
          setAlertChannels(data.alert_channels || ['email']);
          if (data.slack_url) setSlackUrl(data.slack_url);
          if (data.webhook_url) setWebhookUrl(data.webhook_url);

          updateSEO(
            `Certificate Details - ${mapped.domain} | BEACON SSL`,
            `Detailed SSL certificate configuration, browser compatibility, renewal trend, and alert settings for ${mapped.domain}.`
          );
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Error loading certificate details:', err);
        navigate('/dashboard');
      }
    };

    loadCert();
  }, [id, navigate]);

  const toggleDay = (day: number) => {
    setAlertDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleChannel = (ch: string) => {
    setAlertChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleSave = async () => {
    if (!cert) return;
    try {
      const { data, error } = await supabase
        .from('monitored_domains')
        .update({
          alert_days: alertDays,
          alert_channels: alertChannels,
          slack_url: slackUrl,
          webhook_url: webhookUrl,
        })
        .eq('id', cert.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCert(mapDbToCert(data));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err: any) {
      alert('Failed to save alert preferences: ' + err.message);
    }
  };

  const handleRefresh = async () => {
    if (!cert) return;
    try {
      const { checkCertificate } = await import('../services/certService');
      const result = await checkCertificate(cert.domain);
      const updateData = {
        issuer: result.issuer,
        issuer_org: result.issuerOrg,
        subject: result.subject,
        issued_at: result.issuedAt,
        expires_at: result.expiresAt,
        days_remaining: result.daysRemaining,
        status: result.status,
        chain_complete: result.chainComplete,
        ocsp_status: result.ocspStatus,
        key_type: result.keyType,
        key_size: result.keySize,
        signature_algorithm: result.signatureAlgorithm,
        serial_number: result.serialNumber,
        fingerprint_sha256: result.fingerprintSha256,
        san_domains: result.sanDomains,
        chain: result.chain,
        history: result.history,
        last_checked_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('monitored_domains')
        .update(updateData)
        .eq('id', cert.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCert(mapDbToCert(data));
      }
    } catch (e: any) {
      alert('Failed to refresh certificate details: ' + e.message);
    }
  };

  const handleRemove = async () => {
    if (!cert) return;
    try {
      const { error } = await supabase
        .from('monitored_domains')
        .delete()
        .eq('id', cert.id);

      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      alert('Failed to remove domain: ' + err.message);
    }
  };

  if (!cert) return (
    <div className="cert-detail-page container">
      <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
    </div>
  );

  return (
    <div className="cert-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="detail-nav">
          <Link to="/dashboard" className="btn btn-ghost btn-sm detail-back" id="btn-back-to-dashboard">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="detail-actions">
            <button className="btn btn-secondary btn-sm" id="btn-refresh-detail" onClick={handleRefresh}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn btn-danger btn-sm" id="btn-remove-detail" onClick={handleRemove}>
              <Trash2 size={14} /> Remove
            </button>
          </div>
        </div>

        {/* Certificate result */}
        <CertResult result={cert} />

        {/* Alert preferences */}
        <div className="alert-prefs-card card" id="alert-preferences">
          <div className="alert-prefs-header">
            <div>
              <h2 className="heading">
                <Bell size={16} className="text-accent" /> Alert Preferences
              </h2>
              <p className="body-sm text-secondary mt-2">
                Configure when and how you receive alerts for <strong className="text-primary mono">{cert.domain}</strong>
              </p>
            </div>
          </div>

          {/* Days */}
          <div className="prefs-section">
            <h3 className="label text-secondary prefs-section-label">Alert me this many days before expiry</h3>
            <div className="days-grid">
              {ALERT_DAYS.map(day => (
                <button
                  key={day}
                  id={`alert-day-${day}`}
                  className={`day-chip ${alertDays.includes(day) ? 'active' : ''}`}
                  onClick={() => toggleDay(day)}
                >
                  <div className="day-check">{alertDays.includes(day) && <CheckCircle2 size={12} />}</div>
                  <span className="day-number">{day}</span>
                  <span className="day-label label text-secondary">days</span>
                </button>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div className="prefs-section">
            <h3 className="label text-secondary prefs-section-label">Alert channels</h3>
            <div className="channels-list">
              {/* Email */}
              <div className={`channel-item ${alertChannels.includes('email') ? 'active' : ''}`} id="channel-email">
                <div className="channel-toggle" onClick={() => toggleChannel('email')}>
                  <div className={`toggle-pill ${alertChannels.includes('email') ? 'on' : ''}`} />
                </div>
                <div className="channel-info">
                  <strong className="body-sm">Email Alerts</strong>
                  <p className="body-sm text-secondary">Receive alerts at your account email address</p>
                </div>
              </div>

              {/* Slack */}
              <div className={`channel-item ${alertChannels.includes('slack') ? 'active' : ''}`} id="channel-slack">
                <div className="channel-toggle" onClick={() => toggleChannel('slack')}>
                  <div className={`toggle-pill ${alertChannels.includes('slack') ? 'on' : ''}`} />
                </div>
                <div className="channel-info">
                  <strong className="body-sm">Slack Integration</strong>
                  <p className="body-sm text-secondary">Send alerts to a Slack channel via webhook</p>
                  {alertChannels.includes('slack') && (
                    <input
                      id="input-slack-webhook"
                      className="input channel-input"
                      placeholder="https://hooks.slack.com/services/..."
                      value={slackUrl}
                      onChange={e => setSlackUrl(e.target.value)}
                    />
                  )}
                </div>
              </div>

              {/* Webhook */}
              <div className={`channel-item ${alertChannels.includes('webhook') ? 'active' : ''}`} id="channel-webhook">
                <div className="channel-toggle" onClick={() => toggleChannel('webhook')}>
                  <div className={`toggle-pill ${alertChannels.includes('webhook') ? 'on' : ''}`} />
                </div>
                <div className="channel-info">
                  <strong className="body-sm">Custom Webhook</strong>
                  <p className="body-sm text-secondary">POST alerts to your own endpoint</p>
                  {alertChannels.includes('webhook') && (
                    <input
                      id="input-custom-webhook"
                      className="input channel-input"
                      placeholder="https://your-server.com/alerts"
                      value={webhookUrl}
                      onChange={e => setWebhookUrl(e.target.value)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            id="btn-save-prefs"
            className="btn btn-primary"
            onClick={handleSave}
          >
            {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save Preferences</>}
          </button>
        </div>
      </div>
    </div>
  );
}
