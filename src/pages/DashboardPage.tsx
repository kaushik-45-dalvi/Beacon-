import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, RefreshCw, Shield, ShieldAlert, ShieldX,
  Bell, Trash2, ExternalLink, Clock, AlertTriangle,
  LayoutDashboard, Zap, Search
} from 'lucide-react';
import { MonitoredCert } from '../types';
import { formatDate, formatTimeAgo } from '../services/certService';
import { useAuth } from '../context/AuthContext';
import { updateSEO } from '../utils/seo';
import { supabase } from '../services/supabaseClient';
import './DashboardPage.css';

function StatusIcon({ status }: { status: string }) {
  if (status === 'green')  return <Shield size={16} className="text-green" />;
  if (status === 'yellow') return <ShieldAlert size={16} className="text-yellow" />;
  return <ShieldX size={16} className="text-red" />;
}

function DaysChip({ days, status }: { days: number; status: string }) {
  const cls = status === 'green' ? 'badge-green' : status === 'yellow' ? 'badge-yellow' : 'badge-red';
  return <span className={`badge ${cls}`}>{days}d left</span>;
}

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

export default function DashboardPage() {
  const { isAuthenticated, isLoaded, user } = useAuth();
  const navigate = useNavigate();
  const [certs, setCerts] = useState<MonitoredCert[]>([]);
  const [filter, setFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all');
  const [searchQ, setSearchQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [addDomain, setAddDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'batch'>('single');
  const [batchDomains, setBatchDomains] = useState('');
  const [batchChecking, setBatchChecking] = useState(false);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [initLoading, setInitLoading] = useState(false);

  useEffect(() => {
    updateSEO(
      'Monitor Dashboard | BEACON SSL',
      "Manage and monitor your domains' SSL certificates. Track expirations, configure webhook/email channels, and run batch domain checks."
    );
    if (!isLoaded) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!user) return;

    const loadDomains = async () => {
      setInitLoading(true);
      try {
        const { data, error } = await supabase
          .from('monitored_domains')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          setCerts(data.map(mapDbToCert));
        } else {
          // Live fetching of default domains on first load
          const { checkCertificate } = await import('../services/certService');
          const defaults = ['google.com', 'github.com', 'cloudflare.com'];
          
          const fetched = await Promise.all(
            defaults.map(async (d) => {
              try {
                const result = await checkCertificate(d);
                return {
                  user_id: user.id,
                  domain: result.domain,
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
              } catch {
                return null;
              }
            })
          );
          
          const validCerts = fetched.filter((c): c is any => c !== null);
          if (validCerts.length > 0) {
            const { data: inserted, error: insertErr } = await supabase
              .from('monitored_domains')
              .insert(validCerts)
              .select();

            if (insertErr) throw insertErr;
            if (inserted) {
              setCerts(inserted.map(mapDbToCert));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load domains from Supabase:', err);
      } finally {
        setInitLoading(false);
      }
    };

    loadDomains();
  }, [isAuthenticated, isLoaded, user, navigate]);

  if (!isLoaded) {
    return (
      <div className="dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <RefreshCw className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    const { checkCertificate } = await import('../services/certService');
    const updated = await Promise.all(
      certs.map(async (c) => {
        try {
          const result = await checkCertificate(c.domain);
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
            .eq('id', c.id)
            .select()
            .single();

          if (error) throw error;
          if (data) return mapDbToCert(data);
          return c;
        } catch (err) {
          console.error(`Failed to refresh domain ${c.domain}:`, err);
          // Just update last_checked_at
          const { data } = await supabase
            .from('monitored_domains')
            .update({ last_checked_at: new Date().toISOString() })
            .eq('id', c.id)
            .select()
            .single();
          if (data) return mapDbToCert(data);
          return c;
        }
      })
    );
    setCerts(updated);
    setRefreshing(false);
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('monitored_domains')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCerts(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert('Failed to remove domain: ' + err.message);
    }
  };

  const handleAdd = async () => {
    if (!addDomain.trim() || !user) return;
    setAdding(true);

    const { checkCertificate } = await import('../services/certService');
    try {
      const result = await checkCertificate(addDomain);
      const newRecord = {
        user_id: user.id,
        domain: result.domain,
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
        .insert(newRecord)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCerts(prev => [...prev, mapDbToCert(data)]);
        setAddDomain('');
        setShowAdd(false);
      }
    } catch (e: any) {
      alert(e.message || 'Could not fetch certificate. Please check the domain and try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleBatchCheck = async () => {
    const lines = batchDomains
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) return;
    setBatchChecking(true);
    setBatchResults([]);

    const { checkCertificate } = await import('../services/certService');
    const results: any[] = [];

    for (const d of lines) {
      try {
        const result = await checkCertificate(d);
        results.push(result);
      } catch (err: any) {
        results.push({
          domain: d,
          issuer: 'N/A',
          issuerOrg: 'N/A',
          subject: d,
          issuedAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
          daysRemaining: 0,
          status: 'red',
          chainComplete: false,
          ocspStatus: 'unknown',
          keyType: 'N/A',
          keySize: 0,
          signatureAlgorithm: 'N/A',
          serialNumber: 'N/A',
          fingerprintSha256: 'N/A',
          sanDomains: [],
          error: err.message || 'Verification failed'
        });
      }
    }

    setBatchResults(results);
    setBatchChecking(false);
  };

  const handleBatchMonitor = async () => {
    const validResults = batchResults.filter(r => !r.error);
    if (validResults.length === 0 || !user) return;

    const newDbCerts = validResults.map((r) => ({
      user_id: user.id,
      domain: r.domain,
      issuer: r.issuer,
      issuer_org: r.issuerOrg,
      subject: r.subject,
      issued_at: r.issuedAt,
      expires_at: r.expiresAt,
      days_remaining: r.daysRemaining,
      status: r.status,
      chain_complete: r.chainComplete,
      ocsp_status: r.ocspStatus,
      key_type: r.keyType,
      key_size: r.keySize,
      signature_algorithm: r.signatureAlgorithm,
      serial_number: r.serialNumber,
      fingerprint_sha256: r.fingerprintSha256,
      san_domains: r.sanDomains,
      chain: r.chain,
      history: r.history,
      last_checked_at: new Date().toISOString()
    }));

    try {
      const { data, error } = await supabase
        .from('monitored_domains')
        .insert(newDbCerts)
        .select();

      if (error) throw error;

      if (data) {
        setCerts(prev => [...prev, ...data.map(mapDbToCert)]);
        setBatchDomains('');
        setBatchResults([]);
        setShowAdd(false);
      }
    } catch (err: any) {
      alert('Failed to monitor batch domains: ' + err.message);
    }
  };

  const handleDownloadCSV = () => {
    if (batchResults.length === 0) return;
    const headers = 'Domain,Issuer,Expires At,Days Remaining,Status,OCSP Status\n';
    const rows = batchResults.map(r => 
      `"${r.domain}","${r.issuer}","${r.expiresAt}",${r.daysRemaining},"${r.status}","${r.ocspStatus}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'beacon-batch-results.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered + searched
  const filtered = certs.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (searchQ && !c.domain.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const critCount = certs.filter(c => c.status === 'red').length;
  const warnCount = certs.filter(c => c.status === 'yellow').length;
  const okCount   = certs.filter(c => c.status === 'green').length;

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* ── Header ── */}
        <div className="dash-header">
          <div>
            <div className="dash-breadcrumb label text-secondary">
              <LayoutDashboard size={12} /> Dashboard
            </div>
            <h1 className="display-md dash-title">
              Monitor<span className="text-accent">.</span>
            </h1>
            <p className="text-secondary body-sm">
              {certs.length} domains monitored · Welcome back,{' '}
              <strong className="text-primary">{user?.email?.split('@')[0]}</strong>
            </p>
          </div>
          <div className="dash-header-actions">
            <button
              id="btn-refresh"
              className="btn btn-secondary"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh All'}
            </button>
            <button
              id="btn-add-domain"
              className="btn btn-primary"
              onClick={() => setShowAdd(true)}
            >
              <Plus size={14} /> Add Domain
            </button>
          </div>
        </div>

        {/* ── Add domain modal ── */}
        {showAdd && (
          <div className="add-domain-card card card-accent animate-fade-up">
            <div className="modal-tabs">
              <button 
                className={`modal-tab ${addMode === 'single' ? 'active' : ''}`}
                onClick={() => setAddMode('single')}
                disabled={adding || batchChecking}
              >
                Single Domain
              </button>
              <button 
                className={`modal-tab ${addMode === 'batch' ? 'active' : ''}`}
                onClick={() => setAddMode('batch')}
                disabled={adding || batchChecking}
              >
                Batch Check & Export
              </button>
            </div>

            {addMode === 'single' ? (
              <>
                <h3 className="heading mt-4">Add Domain to Monitor</h3>
                <p className="body-sm text-secondary mb-3">We'll fetch the certificate and check it daily.</p>
                <div className="add-domain-row">
                  <input
                    id="input-add-domain"
                    type="text"
                    className="input"
                    placeholder="api.example.com"
                    value={addDomain}
                    onChange={e => setAddDomain(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    disabled={adding}
                    autoFocus
                  />
                  <button id="btn-confirm-add" className="btn btn-primary" onClick={handleAdd} disabled={adding}>
                    {adding ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                    {adding ? 'Adding...' : 'Add'}
                  </button>
                  <button id="btn-cancel-add" className="btn btn-secondary" onClick={() => { setShowAdd(false); setAddDomain(''); }}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="heading mt-4">Batch Check SSL Certificates</h3>
                <p className="body-sm text-secondary mb-3">Enter domain names (one per line) to scan and analyze concurrently.</p>
                
                {batchResults.length === 0 ? (
                  <div className="batch-input-row">
                    <textarea
                      id="textarea-batch-domains"
                      className="input textarea-batch"
                      placeholder="example.com&#10;api.example.com&#10;cdn.example.com"
                      value={batchDomains}
                      onChange={e => setBatchDomains(e.target.value)}
                      disabled={batchChecking}
                      rows={6}
                    />
                    <div className="batch-actions mt-3">
                      <button 
                        id="btn-run-batch" 
                        className="btn btn-primary" 
                        onClick={handleBatchCheck} 
                        disabled={batchChecking || !batchDomains.trim()}
                      >
                        {batchChecking ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                        {batchChecking ? 'Running Check...' : 'Run Batch Check'}
                      </button>
                      <button id="btn-cancel-batch" className="btn btn-secondary" onClick={() => { setShowAdd(false); setBatchResults([]); }} disabled={batchChecking}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="batch-results-container animate-fade-in">
                    <div className="batch-table-scroll">
                      <table className="batch-results-table body-sm">
                        <thead>
                          <tr>
                            <th>Domain</th>
                            <th>Days Left</th>
                            <th>Status</th>
                            <th>Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batchResults.map((r, i) => (
                            <tr key={i} className={r.error ? 'row-error' : ''}>
                              <td className="mono font-semibold">{r.domain}</td>
                              <td className="mono">{r.error ? '—' : `${r.daysRemaining}d`}</td>
                              <td>
                                {r.error ? (
                                  <span className="badge badge-red">Failed</span>
                                ) : (
                                  <span className={`badge badge-${r.status === 'green' ? 'green' : r.status === 'yellow' ? 'yellow' : 'red'}`}>
                                    {r.status === 'green' ? 'Valid' : r.status === 'yellow' ? 'Warning' : 'Critical'}
                                  </span>
                                )}
                              </td>
                              <td className="text-secondary text-xs truncate max-w-xs" title={r.error || r.issuer}>
                                {r.error || r.issuer}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="batch-results-actions mt-4">
                      <button id="btn-batch-csv" className="btn btn-secondary" onClick={handleDownloadCSV}>
                        Download CSV Report
                      </button>
                      <button id="btn-batch-monitor" className="btn btn-primary" onClick={handleBatchMonitor}>
                        Monitor All Valid Domains
                      </button>
                      <button id="btn-batch-reset" className="btn btn-ghost" onClick={() => setBatchResults([])}>
                        Check More Domains
                      </button>
                      <button id="btn-batch-close" className="btn btn-secondary ml-auto" onClick={() => { setShowAdd(false); setBatchResults([]); }}>
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Summary bento ── */}
        <div className="dash-summary">
          <button
            id="filter-all"
            className={`summary-card card ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <div className="summary-count display-md">{certs.length}</div>
            <div className="label text-secondary">Total</div>
          </button>
          <button
            id="filter-ok"
            className={`summary-card card ${filter === 'green' ? 'active active-green' : ''}`}
            onClick={() => setFilter(filter === 'green' ? 'all' : 'green')}
          >
            <div className="summary-count text-green display-md">{okCount}</div>
            <div className="label text-secondary">Healthy</div>
          </button>
          <button
            id="filter-warn"
            className={`summary-card card ${filter === 'yellow' ? 'active active-yellow' : ''}`}
            onClick={() => setFilter(filter === 'yellow' ? 'all' : 'yellow')}
          >
            <div className="summary-count text-yellow display-md">{warnCount}</div>
            <div className="label text-secondary">Expiring Soon</div>
          </button>
          <button
            id="filter-crit"
            className={`summary-card card ${filter === 'red' ? 'active active-red' : ''}`}
            onClick={() => setFilter(filter === 'red' ? 'all' : 'red')}
          >
            <div className="summary-count text-red display-md">{critCount}</div>
            <div className="label text-secondary">Critical</div>
          </button>
        </div>

        {/* ── Alerts strip ── */}
        {critCount > 0 && (
          <div className="dash-alert-strip">
            <AlertTriangle size={16} />
            <strong>{critCount} certificate{critCount > 1 ? 's' : ''} expiring critically soon!</strong>
            <span className="text-secondary body-sm">Renew immediately to avoid outages.</span>
          </div>
        )}

        {/* ── Search ── */}
        <div className="dash-search-wrap">
          <Search size={16} className="dash-search-icon" />
          <input
            id="dashboard-search"
            type="text"
            className="dash-search-input"
            placeholder="Search domains..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>

        {/* ── Cert List ── */}
        <div className="cert-list">
          {initLoading ? (
            <div className="empty-state card">
              <RefreshCw size={40} className="text-accent animate-spin" />
              <p className="heading">Initializing default domains...</p>
              <p className="body-sm text-secondary">
                Fetching real live SSL certificate logs for google.com, github.com, and cloudflare.com
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state card">
              <Shield size={40} className="text-secondary" />
              <p className="heading">No certificates found</p>
              <p className="body-sm text-secondary">
                {searchQ ? 'No domains match your search.' : 'Add your first domain to start monitoring.'}
              </p>
              <button className="btn btn-primary" onClick={() => setShowAdd(true)} id="btn-add-first">
                <Plus size={14} /> Add Domain
              </button>
            </div>
          ) : null}

          {!initLoading && filtered.map(cert => (
            <div
              key={cert.id}
              className={`cert-row card cert-row-${cert.status}`}
              id={`cert-row-${cert.id}`}
            >
              {/* Status bar */}
              <div className={`cert-row-bar bar-${cert.status}`} />

              {/* Main content */}
              <div className="cert-row-main">
                <div className="cert-row-status">
                  <StatusIcon status={cert.status} />
                </div>

                <div className="cert-row-info">
                  <div className="cert-row-domain-row">
                    <span className="cert-row-domain mono heading">{cert.domain}</span>
                    <DaysChip days={cert.daysRemaining} status={cert.status} />
                    {!cert.chainComplete && (
                      <span className="badge badge-yellow">⚠ Incomplete Chain</span>
                    )}
                  </div>
                  <div className="cert-row-meta">
                    <span className="body-sm text-secondary">{cert.issuerOrg}</span>
                    <span className="body-sm text-tertiary">·</span>
                    <span className="body-sm text-secondary">
                      Expires {formatDate(cert.expiresAt)}
                    </span>
                    <span className="body-sm text-tertiary">·</span>
                    <span className="label text-tertiary flex items-center gap-1">
                      <Clock size={10} /> {formatTimeAgo(cert.lastCheckedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="cert-row-actions">
                <Link
                  to={`/certificate/${cert.id}`}
                  className="btn btn-secondary btn-sm"
                  id={`btn-view-${cert.id}`}
                >
                  <ExternalLink size={12} /> View
                </Link>
                <button
                  className="btn btn-secondary btn-sm"
                  id={`btn-alerts-${cert.id}`}
                  title="Alert settings"
                >
                  <Bell size={12} />
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemove(cert.id)}
                  id={`btn-remove-${cert.id}`}
                  title="Remove from monitoring"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Plan limit notice ── */}
        {user?.plan === 'free' && certs.length >= 5 && (
          <div className="plan-limit-card card card-accent">
            <Zap size={20} className="text-accent" />
            <div>
              <strong>Free plan limit reached</strong>
              <p className="body-sm text-secondary">
                You're monitoring {certs.length}/5 domains. Upgrade to Pro to monitor up to 50 domains.
              </p>
            </div>
            <Link to="/pricing" className="btn btn-primary btn-sm" id="btn-upgrade-cta">
              Upgrade to Pro
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
