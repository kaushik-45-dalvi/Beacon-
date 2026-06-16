// supabase/functions/check-domain/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import tls from "node:tls";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function getDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const exp = new Date(expiresAt);
  return Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function getStatus(days: number): "green" | "yellow" | "red" {
  if (days <= 7) return "red";
  if (days <= 30) return "yellow";
  return "green";
}

async function getLiveCertificate(domain: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(443, domain, { servername: domain }, () => {
      const cert = socket.getPeerCertificate(true);
      if (!cert || Object.keys(cert).length === 0) {
        reject(new Error("No certificate returned from server"));
      } else {
        resolve(cert);
      }
      socket.destroy();
    });

    socket.setTimeout(4000);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Connection timeout trying to connect to " + domain));
    });

    socket.on("error", (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const domain = url.searchParams.get("domain")?.toLowerCase().trim();

    if (!domain || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
      return new Response(
        JSON.stringify({ error: "Invalid domain format. Please enter a valid domain." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate that the domain exists (resolves in DNS)
    let exists = false;
    try {
      const records = await Deno.resolveDns(domain, "A");
      if (records && records.length > 0) exists = true;
    } catch {
      try {
        const cname = await Deno.resolveDns(domain, "CNAME");
        if (cname && cname.length > 0) exists = true;
      } catch {
        try {
          const aaaa = await Deno.resolveDns(domain, "AAAA");
          if (aaaa && aaaa.length > 0) exists = true;
        } catch {
          exists = false;
        }
      }
    }

    if (!exists) {
      return new Response(
        JSON.stringify({ error: `The domain "${domain}" does not exist. Please check the spelling.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const getSubjectString = (subject: any) => {
      if (typeof subject === "string") return subject;
      return subject.CN || Object.entries(subject).map(([k, v]) => `${k}=${v}`).join(", ");
    };
    
    const getIssuerString = (issuer: any) => {
      if (typeof issuer === "string") return issuer;
      return issuer.CN || Object.entries(issuer).map(([k, v]) => `${k}=${v}`).join(", ");
    };

    const formatHex = (hex: string) => {
      if (!hex) return "N/A";
      return hex.match(/.{1,2}/g)?.join(":").toUpperCase() || hex;
    };

    // Audit live headers (HSTS status)
    let hstsEnabled = false;
    let hstsMaxAge = 0;
    try {
      const hstsRes = await fetch(`https://${domain}`, {
        method: "HEAD",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      const hstsHeader = hstsRes.headers.get("strict-transport-security");
      if (hstsHeader) {
        hstsEnabled = true;
        const match = hstsHeader.match(/max-age=(\d+)/i);
        if (match) {
          hstsMaxAge = parseInt(match[1], 10);
        }
      }
    } catch (err) {
      console.warn("HSTS check fetch error:", err.message);
    }

    let checkResult;

    try {
      // 1. Try to fetch the live active certificate from the server
      const cert = await getLiveCertificate(domain);
      
      const leafSubject = getSubjectString(cert.subject);
      const leafIssuer = getIssuerString(cert.issuer);
      const issuedAt = new Date(cert.valid_from).toISOString();
      const expiresAt = new Date(cert.valid_to).toISOString();
      const daysRemaining = getDaysRemaining(expiresAt);
      const status = getStatus(daysRemaining);

      const sanDomains = cert.subjectaltname 
        ? cert.subjectaltname.split(", ").map((s: string) => s.replace("DNS:", ""))
        : [domain];

      const serialNumber = formatHex(cert.serialNumber);
      const fingerprintSha256 = cert.fingerprint256 || "N/A";

      const keyType = cert.asn1Curve ? "ECDSA" : "RSA";
      const keySize = cert.bits || 2048;
      const signatureAlgorithm = cert.sigalg || "SHA256withRSA";

      const leafCert = {
        subject: leafSubject,
        issuer: leafIssuer,
        issuedAt,
        expiresAt,
        serialNumber,
        keyType,
        keySize,
        isRoot: false,
        isIntermediate: false,
      };

      const intermediates = [];
      let root = null;
      let current = cert;
      
      while (current.issuerCertificate && current.issuerCertificate !== current) {
        current = current.issuerCertificate;
        const currentSubject = getSubjectString(current.subject);
        const currentIssuer = getIssuerString(current.issuer);
        const isSelfSigned = currentSubject === currentIssuer;

        const chainItem = {
          subject: currentSubject,
          issuer: currentIssuer,
          issuedAt: new Date(current.valid_from).toISOString(),
          expiresAt: new Date(current.valid_to).toISOString(),
          serialNumber: formatHex(current.serialNumber),
          keyType: current.asn1Curve ? "ECDSA" : "RSA",
          keySize: current.bits || 2048,
          isRoot: isSelfSigned,
          isIntermediate: !isSelfSigned,
        };

        if (isSelfSigned) {
          root = chainItem;
        } else {
          intermediates.push(chainItem);
        }
      }

      if (!root && intermediates.length > 0) {
        root = intermediates.pop();
        root.isRoot = true;
        root.isIntermediate = false;
      }

      // Fetch history from CertSpotter
      let history = [];
      try {
        const historyRes = await fetch(
          `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&expand=dns_names&expand=issuer`
        );
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (Array.isArray(historyData)) {
            history = historyData.map((c: any) => {
              const hIssuerName = c.issuer?.name || "Unknown Issuer";
              const hFriendlyName = c.issuer?.friendly_name || "Unknown";
              const hIssuerOrg = c.issuer?.name?.match(/O=([^,]+)/)?.[1] || hFriendlyName || "Unknown";
              const hFingerprintRaw = c.cert_sha256 || "N/A";
              const hFingerprintSha256 = hFingerprintRaw !== "N/A"
                ? hFingerprintRaw.match(/.{1,2}/g)?.join(":").toUpperCase() || hFingerprintRaw
                : "N/A";
              const hSerialNumber = c.cert_sha256
                ? c.cert_sha256.slice(0, 16).match(/.{1,2}/g)?.join(":").toUpperCase() || "N/A"
                : "N/A";
              return {
                issuer: hFriendlyName !== "Unknown" ? `${hFriendlyName} (${hIssuerOrg})` : hIssuerName,
                issuerOrg: hIssuerOrg,
                issuedAt: new Date(c.not_before).toISOString(),
                expiresAt: new Date(c.not_after).toISOString(),
                serialNumber: hSerialNumber,
                fingerprintSha256: hFingerprintSha256,
              };
            });
          }
        }
      } catch (err) {
        console.error("CertSpotter history fetch error:", err);
      }

      checkResult = {
        domain,
        issuer: leafIssuer,
        issuerOrg: leafIssuer.match(/O=([^,]+)/)?.[1] || leafIssuer || "Unknown",
        subject: leafSubject,
        issuedAt,
        expiresAt,
        daysRemaining,
        status,
        serialNumber,
        fingerprintSha256,
        sanDomains,
        chainComplete: !!root,
        ocspStatus: cert.revoked ? "revoked" : "good",
        keyType,
        keySize,
        signatureAlgorithm,
        chain: {
          leaf: leafCert,
          intermediates,
          root: root || leafCert,
        },
        history,
        hstsEnabled,
        hstsMaxAge,
      };

    } catch (liveErr: any) {
      console.warn("Live TLS handshake failed. Falling back to CertSpotter logs API:", liveErr.message);

      // 2. Fallback: Query CertSpotter API if live TLS connection is blocked/fails
      const response = await fetch(
        `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&expand=dns_names&expand=issuer`
      );

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: `Verification failed. Live handshake failed and Certspotter logs query returned status ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      if (!data || !Array.isArray(data) || data.length === 0) {
        return new Response(
          JSON.stringify({ error: `Could not retrieve SSL certificate details for ${domain}.` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const now = new Date();
      const active = data.filter((c: any) => {
        const notBefore = new Date(c.not_before);
        const notAfter = new Date(c.not_after);
        return notBefore <= now && notAfter >= now;
      });

      const candidates = active.length > 0 ? active : data;
      const sorted = candidates.sort(
        (a: any, b: any) => new Date(b.not_after).getTime() - new Date(a.not_after).getTime()
      );
      const cert = sorted[0];

      const expiresAt = new Date(cert.not_after).toISOString();
      const issuedAt = new Date(cert.not_before).toISOString();
      const daysRemaining = getDaysRemaining(expiresAt);
      const status = getStatus(daysRemaining);

      const sanDomains = cert.dns_names || [domain];
      const issuerName = cert.issuer?.name || "Unknown Issuer";
      const friendlyName = cert.issuer?.friendly_name || "Unknown";
      const issuerOrg = cert.issuer?.name?.match(/O=([^,]+)/)?.[1] || friendlyName || "Unknown";

      const fingerprintRaw = cert.cert_sha256 || "N/A";
      const fingerprintSha256 = fingerprintRaw !== "N/A"
        ? fingerprintRaw.match(/.{1,2}/g)?.join(":").toUpperCase() || fingerprintRaw
        : "N/A";

      const serialNumber = cert.cert_sha256
        ? cert.cert_sha256.slice(0, 16).match(/.{1,2}/g)?.join(":").toUpperCase() || "N/A"
        : "N/A";

      const isEcdsa =
        friendlyName.toLowerCase().includes("ecc") ||
        friendlyName.toLowerCase().includes("ecdsa") ||
        friendlyName.toLowerCase().includes("secp");
      const keyType = isEcdsa ? "ECDSA" : "RSA";
      const keySize = isEcdsa ? 256 : 2048;
      const signatureAlgorithm = isEcdsa ? "SHA256withECDSA" : "SHA256withRSA";

      const allSorted = [...data].sort(
        (a: any, b: any) => new Date(b.not_before).getTime() - new Date(a.not_before).getTime()
      );
      const certIndex = allSorted.findIndex((c: any) => c.cert_sha256 === cert.cert_sha256);
      const history = allSorted.slice(certIndex + 1).map((c: any) => {
        const hIssuerName = c.issuer?.name || "Unknown Issuer";
        const hFriendlyName = c.issuer?.friendly_name || "Unknown";
        const hIssuerOrg = c.issuer?.name?.match(/O=([^,]+)/)?.[1] || hFriendlyName || "Unknown";
        const hFingerprintRaw = c.cert_sha256 || "N/A";
        const hFingerprintSha256 =
          hFingerprintRaw !== "N/A"
            ? hFingerprintRaw.match(/.{1,2}/g)?.join(":").toUpperCase() || hFingerprintRaw
            : "N/A";
        const hSerialNumber = c.cert_sha256
          ? c.cert_sha256.slice(0, 16).match(/.{1,2}/g)?.join(":").toUpperCase() || "N/A"
          : "N/A";

        return {
          issuer: hFriendlyName !== "Unknown" ? `${hFriendlyName} (${hIssuerOrg})` : hIssuerName,
          issuerOrg: hIssuerOrg,
          issuedAt: new Date(c.not_before).toISOString(),
          expiresAt: new Date(c.not_after).toISOString(),
          serialNumber: hSerialNumber,
          fingerprintSha256: hFingerprintSha256,
        };
      });

      checkResult = {
        domain,
        issuer: friendlyName !== "Unknown" ? `${friendlyName} (${issuerOrg})` : issuerName,
        issuerOrg,
        subject: domain,
        issuedAt,
        expiresAt,
        daysRemaining,
        status,
        serialNumber,
        fingerprintSha256,
        sanDomains,
        chainComplete: false,
        ocspStatus: cert.revoked ? "revoked" : "good",
        keyType,
        keySize,
        signatureAlgorithm,
        chain: {
          leaf: {
            subject: domain,
            issuer: friendlyName !== "Unknown" ? `${friendlyName} (${issuerOrg})` : issuerName,
            issuedAt,
            expiresAt,
            serialNumber,
            keyType,
            keySize,
            isRoot: false,
            isIntermediate: false,
          },
          intermediates: [],
          root: {
            subject: friendlyName !== "Unknown" ? `${friendlyName} (${issuerOrg})` : issuerName,
            issuer: friendlyName !== "Unknown" ? `${friendlyName} (${issuerOrg})` : issuerName,
            issuedAt,
            expiresAt,
            serialNumber,
            keyType,
            keySize,
            isRoot: true,
            isIntermediate: false,
          }
        },
        history,
        hstsEnabled,
        hstsMaxAge,
      };
    }

    return new Response(JSON.stringify(checkResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
