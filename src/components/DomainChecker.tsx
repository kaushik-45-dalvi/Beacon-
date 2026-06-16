import React, { useState, useRef } from 'react';
import { Search, ArrowRight, Loader2, Globe } from 'lucide-react';
import { CertCheckResult } from '../types';
import { checkCertificate } from '../services/certService';
import { SAMPLE_DOMAINS } from '../data/mockData';
import './DomainChecker.css';

interface Props {
  onResult: (result: CertCheckResult) => void;
  onLoading: (loading: boolean) => void;
}

export default function DomainChecker({ onResult, onLoading }: Props) {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCheck = async (domainToCheck?: string) => {
    const target = (domainToCheck || domain).trim();
    if (!target) {
      setError('Please enter a domain name');
      inputRef.current?.focus();
      return;
    }
    setError('');
    setLoading(true);
    onLoading(true);
    try {
      const result = await checkCertificate(target);
      onResult(result);
    } catch (e: any) {
      setError(e.message || 'Failed to check certificate. Please try again.');
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCheck();
  };

  const handleSample = (d: string) => {
    setDomain(d);
    handleCheck(d);
  };

  return (
    <div className="domain-checker">
      {/* Main input */}
      <div className="checker-input-wrap">
        <div className="checker-input-icon">
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Globe size={20} />
          )}
        </div>
        <input
          ref={inputRef}
          id="domain-input"
          type="text"
          className="checker-input"
          placeholder="example.com"
          value={domain}
          onChange={e => { setDomain(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoComplete="off"
          spellCheck={false}
          aria-label="Enter domain name"
        />
        <button
          id="btn-check-cert"
          className={`checker-btn ${loading ? 'loading' : ''}`}
          onClick={() => handleCheck()}
          disabled={loading}
          aria-label="Check certificate"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <span className="hide-mobile">Check</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="checker-error animate-fade-in" role="alert">
          <Search size={14} />
          {error}
        </div>
      )}

      {/* Sample domains */}
      <div className="checker-samples">
        <span className="label text-tertiary">Try:</span>
        {SAMPLE_DOMAINS.map((d, i) => (
          <button
            key={d}
            id={`sample-domain-${i}`}
            className="sample-chip"
            onClick={() => handleSample(d)}
            disabled={loading}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}
