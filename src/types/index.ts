export type CertStatus = 'green' | 'yellow' | 'red';
export type OcspStatus = 'good' | 'revoked' | 'unknown';
export type AlertChannel = 'email' | 'slack' | 'webhook';
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

export interface Certificate {
  subject: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  serialNumber: string;
  keyType: string;
  keySize: number;
  isRoot: boolean;
  isIntermediate: boolean;
}

export interface CertificateChain {
  leaf: Certificate;
  intermediates: Certificate[];
  root: Certificate;
}

export interface HistoricalCert {
  issuer: string;
  issuerOrg: string;
  issuedAt: string;
  expiresAt: string;
  serialNumber: string;
  fingerprintSha256: string;
}

export interface CertCheckResult {
  domain: string;
  issuer: string;
  issuerOrg: string;
  subject: string;
  issuedAt: string;
  expiresAt: string;
  daysRemaining: number;
  status: CertStatus;
  chainComplete: boolean;
  ocspStatus: OcspStatus;
  keyType: string;
  keySize: number;
  signatureAlgorithm: string;
  serialNumber: string;
  fingerprintSha256: string;
  sanDomains: string[];
  chain?: CertificateChain;
  history?: HistoricalCert[];
  error?: string;
}

export interface MonitoredCert extends CertCheckResult {
  id: string;
  lastCheckedAt: string;
  alertPreferences?: AlertPreference[];
}

export interface AlertPreference {
  id: string;
  channel: AlertChannel;
  daysBefore: number[];
  enabled: boolean;
  slackWebhookUrl?: string;
  customWebhookUrl?: string;
}

export interface User {
  id: string;
  email: string;
  plan: SubscriptionPlan;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoaded: boolean;
}
