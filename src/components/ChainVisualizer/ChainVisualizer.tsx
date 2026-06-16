import { CertificateChain, Certificate } from '../../types';
import { formatDate } from '../../services/certService';
import { Shield, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import './ChainVisualizer.css';

interface CertNodeProps {
  cert: Certificate;
  type: 'leaf' | 'intermediate' | 'root';
  isLast?: boolean;
}

function CertNode({ cert, type, isLast }: CertNodeProps) {
  const [expanded, setExpanded] = useState(type === 'leaf');

  const typeConfig = {
    leaf:         { label: 'Domain Certificate', color: 'var(--accent)', bg: 'var(--accent-dim)' },
    intermediate: { label: 'Intermediate CA',     color: 'var(--yellow)', bg: 'var(--yellow-dim)' },
    root:         { label: 'Root CA',              color: 'var(--green)',  bg: 'var(--green-dim)' },
  };

  const cfg = typeConfig[type];

  return (
    <div className="chain-node-wrap">
      <div
        className={`chain-node ${expanded ? 'expanded' : ''}`}
        onClick={() => setExpanded(!expanded)}
        style={{ '--node-color': cfg.color, '--node-bg': cfg.bg } as React.CSSProperties}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setExpanded(!expanded)}
        id={`chain-node-${type}`}
      >
        <div className="chain-node-header">
          <div className="chain-node-icon">
            <Shield size={14} />
          </div>
          <div className="chain-node-info">
            <div className="chain-node-subject mono">{cert.subject}</div>
            <div className="chain-node-type label">{cfg.label}</div>
          </div>
          <ChevronDown
            size={16}
            className={`chain-expand-icon ${expanded ? 'rotated' : ''}`}
          />
        </div>

        {expanded && (
          <div className="chain-node-details animate-fade-in">
            <div className="chain-detail-row">
              <span className="chain-detail-label label text-secondary">Issuer</span>
              <span className="chain-detail-value body-sm mono">{cert.issuer}</span>
            </div>
            <div className="chain-detail-row">
              <span className="chain-detail-label label text-secondary">Issued</span>
              <span className="chain-detail-value body-sm">{formatDate(cert.issuedAt)}</span>
            </div>
            <div className="chain-detail-row">
              <span className="chain-detail-label label text-secondary">Expires</span>
              <span className="chain-detail-value body-sm">{formatDate(cert.expiresAt)}</span>
            </div>
            <div className="chain-detail-row">
              <span className="chain-detail-label label text-secondary">Key</span>
              <span className="chain-detail-value body-sm">{cert.keyType} {cert.keySize}-bit</span>
            </div>
            <div className="chain-detail-row">
              <span className="chain-detail-label label text-secondary">Serial</span>
              <span className="chain-detail-value body-sm mono">{cert.serialNumber}</span>
            </div>
          </div>
        )}
      </div>

      {/* Connector */}
      {!isLast && (
        <div className="chain-connector">
          <div className="chain-connector-line" />
          <div className="chain-connector-label label text-tertiary">signed by</div>
          <div className="chain-connector-line" />
        </div>
      )}
    </div>
  );
}

interface Props {
  chain: CertificateChain;
}

export default function ChainVisualizer({ chain }: Props) {
  const nodes = [
    { cert: chain.leaf, type: 'leaf' as const },
    ...chain.intermediates.map(cert => ({ cert, type: 'intermediate' as const })),
    { cert: chain.root, type: 'root' as const },
  ];

  return (
    <div className="chain-visualizer">
      {nodes.map((node, i) => (
        <CertNode
          key={i}
          cert={node.cert}
          type={node.type}
          isLast={i === nodes.length - 1}
        />
      ))}
    </div>
  );
}
