// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSignature = req.headers.get("stripe-signature");
  const clerkSecretKey = Deno.env.get("CLERK_SECRET_KEY") || "";

  if (!clerkSecretKey) {
    return new Response(
      JSON.stringify({ error: "Missing CLERK_SECRET_KEY server environment variable." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const bodyText = await req.text();
    let event;

    try {
      event = JSON.parse(bodyText);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType = event.type;
    let clerkUserId: string | null = null;
    let newPlan: "free" | "pro" | "enterprise" = "free";

    console.log(`Processing Stripe event: ${eventType}`);

    if (eventType === "checkout.session.completed") {
      const session = event.data.object;
      clerkUserId = session.metadata?.clerk_user_id || session.client_reference_id;
      newPlan = "pro"; // Default checkout plan
    } else if (eventType === "customer.subscription.updated") {
      const subscription = event.data.object;
      clerkUserId = subscription.metadata?.clerk_user_id;
      const status = subscription.status;
      newPlan = status === "active" || status === "trialing" ? "pro" : "free";
    } else if (eventType === "customer.subscription.deleted") {
      const subscription = event.data.object;
      clerkUserId = subscription.metadata?.clerk_user_id;
      newPlan = "free";
    }

    if (clerkUserId) {
      console.log(`Updating user ${clerkUserId} subscription plan to ${newPlan}`);
      
      // Update Clerk User publicMetadata using Clerk Admin backend REST API
      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}/metadata`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${clerkSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_metadata: {
            plan: newPlan,
          },
        }),
      });

      if (!clerkRes.ok) {
        const errText = await clerkRes.text();
        console.error(`Clerk API call failed: ${errText}`);
        return new Response(
          JSON.stringify({ error: `Failed to update Clerk metadata: ${errText}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Clerk metadata successfully updated for ${clerkUserId}`);
      return new Response(JSON.stringify({ success: true, user: clerkUserId, plan: newPlan }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "No action required" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
