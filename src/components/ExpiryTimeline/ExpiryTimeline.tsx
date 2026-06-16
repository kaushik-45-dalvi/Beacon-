import { formatDate } from '../../services/certService';
import './ExpiryTimeline.css';

interface Props {
  issuedAt: string;
  expiresAt: string;
  daysRemaining: number;
  status: 'green' | 'yellow' | 'red';
}

export default function ExpiryTimeline({ issuedAt, expiresAt, daysRemaining, status }: Props) {
  const totalMs = new Date(expiresAt).getTime() - new Date(issuedAt).getTime();
  const elapsedMs = Date.now() - new Date(issuedAt).getTime();
  const progressPct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

  const colorMap = {
    green:  'var(--green)',
    yellow: 'var(--yellow)',
    red:    'var(--red)',
  };
  const barColor = colorMap[status];

  return (
    <div className="expiry-timeline">
      <div className="timeline-labels">
        <span className="label text-secondary">Issued: {formatDate(issuedAt)}</span>
        <span className="label text-secondary">Expires: {formatDate(expiresAt)}</span>
      </div>
      <div className="timeline-track">
        <div
          className="timeline-fill"
          style={{
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${barColor}44, ${barColor})`,
          }}
        />
        <div
          className="timeline-cursor"
          style={{ left: `${progressPct}%`, borderColor: barColor }}
        >
          <div className="timeline-tooltip" style={{ color: barColor }}>
            Today
          </div>
        </div>
      </div>
      <div className="timeline-subtext">
        <span className="body-sm text-secondary">
          {Math.round(progressPct)}% of certificate lifetime used
        </span>
        <span className="body-sm" style={{ color: barColor }}>
          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
        </span>
      </div>
    </div>
  );
}
