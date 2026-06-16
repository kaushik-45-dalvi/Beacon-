import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import './SANGrid.css';

interface Props {
  domains: string[];
}

export default function SANGrid({ domains }: Props) {
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  const handleCopy = (domain: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(domain);
    setCopiedDomain(domain);
    setTimeout(() => setCopiedDomain(null), 1500);
  };

  return (
    <div className="san-grid">
      {domains.map((domain, i) => (
        <div
          key={i}
          className="san-chip"
          id={`san-chip-${i}`}
          onClick={e => handleCopy(domain, e)}
          title={`Click to copy: ${domain}`}
          role="button"
          tabIndex={0}
        >
          <span className="san-domain mono">{domain}</span>
          <span className="san-copy-icon">
            {copiedDomain === domain ? <Check size={11} /> : <Copy size={11} />}
          </span>
        </div>
      ))}
    </div>
  );
}
