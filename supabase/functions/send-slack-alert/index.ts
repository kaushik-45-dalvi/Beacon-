// supabase/functions/send-slack-alert/index.ts
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
    const { webhookUrl, domain, daysRemaining, issuer, expiresAt, status, keyType, keySize } = body;

    if (!webhookUrl || !domain) {
      return new Response(
        JSON.stringify({ error: "webhookUrl and domain are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate it looks like a Slack webhook URL
    if (!webhookUrl.startsWith("https://hooks.slack.com/")) {
      return new Response(
        JSON.stringify({ error: "Invalid Slack webhook URL. Must start with https://hooks.slack.com/" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const urgencyEmoji = daysRemaining <= 7  ? "🚨" : daysRemaining <= 30 ? "⚠️" : "✅";
    const urgencyLabel = daysRemaining <= 7  ? "CRITICAL" : daysRemaining <= 30 ? "WARNING" : "VALID";
    const urgencyColor = daysRemaining <= 7  ? "#E53E3E" : daysRemaining <= 30 ? "#D69E2E" : "#38A169";

    const formattedExpiry = new Date(expiresAt).toLocaleDateString("en-US", {
      weekday: "short", year: "numeric", month: "short", day: "numeric"
    });

    // Slack Block Kit payload — rich formatted message
    const slackPayload = {
      username: "BEACON SSL Monitor",
      icon_emoji: ":shield:",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${urgencyEmoji} SSL Certificate Alert — ${domain}`,
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Domain*\n\`${domain}\`` },
            { type: "mrkdwn", text: `*Status*\n${urgencyLabel}` },
            { type: "mrkdwn", text: `*Days Remaining*\n*${daysRemaining} days*` },
            { type: "mrkdwn", text: `*Expires*\n${formattedExpiry}` },
            { type: "mrkdwn", text: `*Issued By*\n${issuer}` },
            { type: "mrkdwn", text: `*Key*\n${keyType} ${keySize}-bit` }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: daysRemaining <= 30
              ? `⚡ *Action required* — renew the certificate for \`${domain}\` before *${formattedExpiry}* to avoid service disruption.`
              : `✅ Certificate is healthy. Next check will trigger when expiry approaches 30 days.`
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "🔍 View in Beacon", emoji: true },
              url: "https://beacon-pi-two.vercel.app",
              style: "primary"
            }
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Sent by *BEACON SSL Monitor* · <https://beacon-pi-two.vercel.app|beacon-pi-two.vercel.app>`
            }
          ]
        }
      ],
      // Fallback plain text for older Slack clients
      text: `${urgencyEmoji} SSL Certificate Alert for ${domain}: ${daysRemaining} days remaining. Expires ${formattedExpiry}. Issued by ${issuer}.`
    };

    const slackRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackPayload),
    });

    if (!slackRes.ok) {
      const errText = await slackRes.text();
      console.error("Slack webhook error:", errText);
      return new Response(
        JSON.stringify({ error: `Slack returned ${slackRes.status}: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
