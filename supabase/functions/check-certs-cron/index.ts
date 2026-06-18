// supabase/functions/check-certs-cron/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Missing server environment variables." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Fetch all domains from DB
    const { data: domains, error: fetchErr } = await supabase
      .from("monitored_domains")
      .select("*");

    if (fetchErr) throw fetchErr;
    if (!domains || domains.length === 0) {
      return new Response(JSON.stringify({ message: "No domains to check." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    // 2. Loop and check each domain
    for (const record of domains) {
      try {
        const domain = record.domain;
        const res = await fetch(
          `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&expand=dns_names&expand=issuer`
        );
        
        if (!res.ok) {
          console.error(`Failed to fetch certspotter details for ${domain}`);
          continue;
        }

        const data = await res.json();
        if (!data || !Array.isArray(data) || data.length === 0) continue;

        const now = new Date();
        const active = data.filter((cert: any) => {
          const notBefore = new Date(cert.not_before);
          const notAfter = new Date(cert.not_after);
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

        const friendlyName = cert.issuer?.friendly_name || "Unknown";
        const issuerOrg = cert.issuer?.name?.match(/O=([^,]+)/)?.[1] || friendlyName || "Unknown";
        const serialNumber = cert.cert_sha256
          ? cert.cert_sha256.slice(0, 16).match(/.{1,2}/g)?.join(":").toUpperCase() || "N/A"
          : "N/A";

        // Update the domain in the DB
        const { error: updateErr } = await supabase
          .from("monitored_domains")
          .update({
            days_remaining: daysRemaining,
            status,
            expires_at: expiresAt,
            issuer: friendlyName,
            issuer_org: issuerOrg,
            serial_number: serialNumber,
            last_checked_at: new Date().toISOString(),
          })
          .eq("id", record.id);

        if (updateErr) {
          console.error(`DB Update Error for ${domain}:`, updateErr);
        }

        // 3. Trigger alert if matches alert_days config
        const alertDays: number[] = record.alert_days || [30, 7, 1];
        const alertChannels: string[] = record.alert_channels || [];

        if (alertDays.includes(daysRemaining) && alertChannels.length > 0) {
          const alertMessage = `SSL Alert: The certificate for ${domain} expires in ${daysRemaining} days (on ${new Date(expiresAt).toLocaleDateString()}). Issuer: ${issuerOrg}. Action required.`;

          for (const channel of alertChannels) {
            if (channel === "slack" && record.slack_url) {
              await fetch(record.slack_url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: alertMessage }),
              });
            } else if (channel === "webhook" && record.webhook_url) {
              await fetch(record.webhook_url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  event: "ssl_expiration_alert",
                  domain,
                  days_remaining: daysRemaining,
                  expires_at: expiresAt,
                  status,
                  message: alertMessage,
                }),
              });
            } else if (channel === "email" && resendApiKey) {
              // Send email using Resend
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${resendApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "Beacon SSL <alerts@beaconssl.dev>",
                  to: [record.user_email || "user@beacon.dev"], // Default fallback or metadata if stored
                  subject: `🚨 SSL Expiration Alert: ${domain}`,
                  html: `<p>${alertMessage}</p><p>View your dashboard at <a href="https://beaconssl.dev/dashboard">Beacon</a>.</p>`,
                }),
              });
            }
          }
        }

        results.push({ domain, status, daysRemaining });
      } catch (err: any) {
        console.error(`Error processing cron check for ${record.domain}:`, err.message);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results }), {
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
