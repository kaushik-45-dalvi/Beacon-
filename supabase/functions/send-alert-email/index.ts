// supabase/functions/send-alert-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, domain, daysRemaining, issuer, expiresAt, status, keyType, keySize } = body;

    if (!email || !domain) {
      return new Response(
        JSON.stringify({ error: "email and domain are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured. Set RESEND_API_KEY in Supabase secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // RESEND_FROM_EMAIL: set this in Supabase secrets to your verified domain sender,
    // e.g. "BEACON SSL <alerts@yourdomain.com>".
    // Until a custom domain is verified, keep using onboarding@resend.dev (sends to any address
    // only when a custom domain is active; otherwise Resend restricts delivery to the
    // account owner's email). See: https://resend.com/docs/dashboard/domains/introduction
    const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "BEACON SSL <onboarding@resend.dev>";

    const urgencyColor = daysRemaining <= 7  ? "#E53E3E"
                       : daysRemaining <= 30 ? "#D69E2E"
                       : "#38A169";
    const urgencyLabel = daysRemaining <= 7  ? "🚨 CRITICAL"
                       : daysRemaining <= 30 ? "⚠️ WARNING"
                       : "✅ VALID";
    const urgencyBg    = daysRemaining <= 7  ? "#FFF5F5"
                       : daysRemaining <= 30 ? "#FFFFF0"
                       : "#F0FFF4";

    const formattedExpiry = new Date(expiresAt).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SSL Certificate Alert — ${domain}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e6edf3; }
    .wrapper { max-width: 580px; margin: 40px auto; background: #161b22; border-radius: 16px; overflow: hidden; border: 1px solid #30363d; }
    .header { background: linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%); padding: 32px 40px; border-bottom: 1px solid #30363d; }
    .beacon-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .beacon-dot { width: 28px; height: 28px; background: linear-gradient(135deg, #6366f1, #a78bfa); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .beacon-name { font-size: 18px; font-weight: 700; color: #e6edf3; letter-spacing: -0.3px; }
    .header-title { font-size: 22px; font-weight: 700; color: #e6edf3; line-height: 1.3; }
    .header-sub { font-size: 14px; color: #8b949e; margin-top: 6px; }
    .body { padding: 32px 40px; }
    .status-badge { display: inline-flex; align-items: center; gap: 8px; background: ${urgencyBg}; border: 1px solid ${urgencyColor}; color: ${urgencyColor}; padding: 8px 16px; border-radius: 100px; font-size: 13px; font-weight: 700; margin-bottom: 24px; }
    .domain-block { background: #0d1117; border: 1px solid #30363d; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
    .domain-name { font-size: 20px; font-weight: 700; color: #e6edf3; font-family: 'Courier New', monospace; margin-bottom: 4px; }
    .domain-sub { font-size: 13px; color: #8b949e; }
    .days-big { font-size: 52px; font-weight: 900; color: ${urgencyColor}; line-height: 1; margin: 16px 0 4px; font-family: -apple-system, sans-serif; }
    .days-label { font-size: 14px; color: #8b949e; }
    .divider { height: 1px; background: #30363d; margin: 24px 0; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .detail-item { background: #0d1117; border: 1px solid #30363d; border-radius: 10px; padding: 14px 16px; }
    .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #8b949e; margin-bottom: 4px; }
    .detail-value { font-size: 14px; font-weight: 600; color: #e6edf3; word-break: break-all; }
    .cta-btn { display: block; text-align: center; background: linear-gradient(135deg, #6366f1, #a78bfa); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; margin-bottom: 16px; }
    .footer { background: #0d1117; padding: 20px 40px; border-top: 1px solid #30363d; text-align: center; }
    .footer p { font-size: 12px; color: #6e7681; line-height: 1.6; }
    .footer a { color: #6366f1; text-decoration: none; }
    .mono { font-family: 'Courier New', monospace; }
    .expiry-bar { background: #0d1117; border: 1px solid #30363d; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
    .expiry-bar-label { font-size: 12px; color: #8b949e; margin-bottom: 8px; }
    .expiry-bar-track { height: 8px; background: #21262d; border-radius: 100px; overflow: hidden; }
    .expiry-bar-fill { height: 100%; background: ${urgencyColor}; border-radius: 100px; width: ${Math.min(100, Math.max(2, daysRemaining))}%; }
    .expiry-date { font-size: 13px; color: #e6edf3; margin-top: 8px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="beacon-logo">
        <div class="beacon-dot">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <span class="beacon-name">BEACON SSL</span>
      </div>
      <div class="header-title">SSL Certificate Alert</div>
      <div class="header-sub">This is a simulated alert preview from Beacon's team notification system</div>
    </div>

    <div class="body">
      <div class="status-badge">${urgencyLabel}</div>

      <div class="domain-block">
        <div class="domain-name">${domain}</div>
        <div class="domain-sub">SSL/TLS Certificate · Issued by ${issuer}</div>
        <div class="days-big">${daysRemaining}</div>
        <div class="days-label">days remaining until expiry</div>
      </div>

      <div class="expiry-bar">
        <div class="expiry-bar-label">Certificate validity countdown</div>
        <div class="expiry-bar-track">
          <div class="expiry-bar-fill"></div>
        </div>
        <div class="expiry-date">Expires: ${formattedExpiry}</div>
      </div>

      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Domain</div>
          <div class="detail-value mono">${domain}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Status</div>
          <div class="detail-value" style="color: ${urgencyColor}">${urgencyLabel}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Issued By</div>
          <div class="detail-value">${issuer}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Key</div>
          <div class="detail-value">${keyType} ${keySize}-bit</div>
        </div>
      </div>

      <div class="divider"></div>

      <a class="cta-btn" href="https://beacon-pi-two.vercel.app">
        🔍 View Full Certificate Details in Beacon
      </a>

      <p style="font-size: 13px; color: #8b949e; text-align: center;">
        ${daysRemaining <= 30
          ? `⚡ Action recommended — renew this certificate before <strong>${formattedExpiry}</strong> to avoid downtime.`
          : `✅ Certificate is valid. You'll receive another alert when expiry approaches.`
        }
      </p>
    </div>

    <div class="footer">
      <p>
        You received this alert because you requested a simulation from <a href="https://beacon-pi-two.vercel.app">BEACON SSL Monitor</a>.
        <br />This is a real email sent from the Beacon alert system.
      </p>
    </div>
  </div>
</body>
</html>`;

    const textBody = `BEACON SSL Alert — ${domain}

Status: ${urgencyLabel}
Domain: ${domain}
Days Remaining: ${daysRemaining}
Expires: ${formattedExpiry}
Issued By: ${issuer}
Key: ${keyType} ${keySize}-bit

View details at: https://beacon-pi-two.vercel.app

This is a simulated alert preview from Beacon SSL Monitor.`;

    const subjectPrefix = daysRemaining <= 7  ? "🚨 CRITICAL"
                        : daysRemaining <= 30 ? "⚠️ ACTION REQUIRED"
                        : "✅ Certificate Status";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `${subjectPrefix}: ${domain} expires in ${daysRemaining} days`,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend API error:", errText);
      // Try to surface a helpful message
      let errMsg = `Failed to send email (Resend status ${res.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.message) errMsg = errJson.message;
        // Common Resend restriction: not a verified domain
        if (res.status === 403 || (errJson.name && errJson.name === "validation_error")) {
          errMsg = `Resend rejected the request: ${errJson.message || errText}. ` +
            `To send to any email address, verify a custom domain at resend.com/domains and ` +
            `set RESEND_FROM_EMAIL in your Supabase secrets to "BEACON SSL <alerts@yourdomain.com>".`;
        }
      } catch { /* not JSON, use raw text */ errMsg = errText || errMsg; }
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resData = await res.json();
    return new Response(
      JSON.stringify({ success: true, id: resData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
