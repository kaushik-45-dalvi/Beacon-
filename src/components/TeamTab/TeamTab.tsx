import { CertCheckResult } from '../../types';
import { useState } from 'react';
import { Users, Bell, Play, X, MessageSquare, Check, Eye } from 'lucide-react';
import './TeamTab.css';

interface Props {
  result: CertCheckResult;
}

export default function TeamTab({ result }: Props) {
  const [slackAlertState, setSlackAlertState] = useState<'idle' | 'showing' | 'snoozed' | 'done'>('idle');

  const teamMembers = [
    { email: 'alice@beaconssl.com', role: 'Admin', action: 'Added domain monitoring', time: 'Jan 15' },
    { email: 'bob@beaconssl.com', role: 'Developer', action: 'Viewed certificate', time: 'Just now' },
    { email: 'charlie@beaconssl.com', role: 'DevOps', action: 'Updated alert to Slack', time: 'Apr 13' },
  ];

  const activityLog = [
    { user: 'Bob', action: 'Requested manual verification check', time: 'Just now' },
    { user: 'Charlie', action: 'Configured Slack webhook preferences', time: '2 days ago' },
    { user: 'Alice', action: 'Created slack alert subscription', time: 'June 01' },
    { user: 'Alice', action: 'Added domain to global monitoring catalog', time: 'Jan 15' },
  ];

  const triggerSlackSimulation = () => {
    setSlackAlertState('showing');
  };

  const closeSlackAlert = () => {
    setSlackAlertState('idle');
  };

  const snoozeAlert = () => {
    setSlackAlertState('snoozed');
    setTimeout(() => {
      setSlackAlertState('idle');
    }, 3000);
  };

  const markAlertDone = () => {
    setSlackAlertState('done');
    setTimeout(() => {
      setSlackAlertState('idle');
    }, 3000);
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
            Manage who has access to certificate monitoring notifications and logs.
          </p>

          <div className="members-list">
            {teamMembers.map((member, i) => (
              <div key={i} className="member-item body-sm">
                <div className="member-details">
                  <span className="font-semibold text-primary">{member.email.split('@')[0]}</span>
                  <span className="text-secondary text-xs">({member.email})</span>
                  <p className="text-secondary text-xs mt-0.5">{member.action} on {member.time}</p>
                </div>
                <span className={`badge ${member.role === 'Admin' ? 'badge-accent' : 'badge-neutral'}`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Activity Logs & Audit Trail */}
        <div className="team-panel card card-elevated">
          <div className="panel-header">
            <Eye className="panel-icon text-accent" size={20} />
            <h3 className="heading">Activity & Audit Logs</h3>
          </div>
          <p className="body-sm text-secondary mb-4">
            A continuous audit trail of modifications made to <span className="mono text-primary">{result.domain}</span> monitoring.
          </p>

          <div className="audit-list">
            {activityLog.map((log, i) => (
              <div key={i} className="audit-item body-sm">
                <div className="audit-time label text-tertiary text-xs">{log.time}</div>
                <div className="audit-text">
                  <strong className="text-primary">{log.user}</strong> {log.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simulator Section */}
      <div className="simulator-card card card-elevated mt-6">
        <div className="simulator-header">
          <Bell className="simulator-icon text-accent" size={24} />
          <div>
            <h4 className="heading">Slack Integration & Simulator</h4>
            <p className="body-sm text-secondary">Test Slack webhook notifications in real-time</p>
          </div>
        </div>

        <div className="simulator-content mt-4">
          <p className="body-sm text-secondary mb-4">
            You don't need to configure a real webhook to see how BEACON keeps your team updated. Run our simulator to preview an alert notification.
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

      {/* Floating Slack Notification Bubble */}
      {slackAlertState !== 'idle' && (
        <div className="slack-overlay-container">
          <div className="slack-bubble animate-slide-right">
            <div className="slack-bubble-header">
              <div className="slack-brand">
                <MessageSquare size={14} className="slack-logo-icon" />
                <span className="slack-title font-semibold">Slack Notification</span>
              </div>
              <button className="slack-close-btn" onClick={closeSlackAlert}>
                <X size={12} />
              </button>
            </div>
            
            <div className="slack-bubble-body">
              {slackAlertState === 'showing' && (
                <>
                  <div className="slack-alert-headline font-semibold">🚨 Certificate Expiring Soon!</div>
                  <div className="slack-alert-text mt-1 body-sm">
                    The SSL certificate for <span className="mono font-semibold">{result.domain}</span> expires in <strong className="text-red">{result.daysRemaining} days</strong>.
                  </div>
                  <div className="slack-meta-info mt-2">
                    <div><strong>Assigned To:</strong> @devops-team</div>
                    <div><strong>Severity:</strong> {result.status.toUpperCase()}</div>
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
                  <Check size={16} /> Notification alert snoozed for 24 hours!
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
