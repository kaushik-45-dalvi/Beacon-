import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import BeaconLogo from './BeaconLogo';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="logo-icon-sm">
                <BeaconLogo size={14} />
              </div>
              <span className="logo-text-sm">BEACON</span>
            </div>
            <p className="footer-tagline text-secondary body-sm">
              Zero-friction SSL certificate visualization and monitoring. Check any domain. Get alerted before disaster.
            </p>

          </div>

          {/* Product */}
          <div className="footer-col">
            <h4 className="footer-col-title label text-secondary">Product</h4>
            <ul className="footer-links">
              <li><Link to="/" className="footer-link" id="footer-checker">Certificate Checker</Link></li>
              <li><Link to="/dashboard" className="footer-link" id="footer-monitoring">Monitoring</Link></li>
              <li><Link to="/pricing" className="footer-link" id="footer-pricing">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-col">
            <h4 className="footer-col-title label text-secondary">Resources</h4>
            <ul className="footer-links">
              <li>
                <a href="https://securityheaders.com" target="_blank" rel="noopener noreferrer" className="footer-link" id="footer-securityheaders">
                  Security Headers <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="footer-link" id="footer-dnschecker">
                  DNS Checker <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <a href="https://ssl-config.mozilla.org" target="_blank" rel="noopener noreferrer" className="footer-link" id="footer-sslconfig">
                  Mozilla SSL Config <ExternalLink size={10} />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-col">
            <h4 className="footer-col-title label text-secondary">Legal</h4>
            <ul className="footer-links">
              <li><Link to="/privacy" className="footer-link" id="footer-privacy">Privacy Policy</Link></li>
              <li><Link to="/terms" className="footer-link" id="footer-terms">Terms of Service</Link></li>
              <li><Link to="/security" className="footer-link" id="footer-security">Security</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="body-sm text-tertiary" style={{ minWidth: '150px' }}>
            © 2026 Beacon.
          </p>
          <p className="body-sm text-secondary font-medium" style={{ flexGrow: 1, textAlign: 'center' }}>
            Designed & engineered by <a href="https://www.linkedin.com/company/the-dreambit-labs/" target="_blank" rel="noopener noreferrer" className="text-secondary font-semibold" style={{ textDecoration: 'underline' }}>The DreamBit Labs</a>.
          </p>
          <p className="body-sm text-tertiary" style={{ minWidth: '150px', textAlign: 'right' }}>
            Certificate data is public by definition.
          </p>
        </div>
      </div>
    </footer>
  );
}
