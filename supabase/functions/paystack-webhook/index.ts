import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const event = JSON.parse(body);

    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(PAYSTACK_SECRET_KEY);
    const bodyData = encoder.encode(body);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"],
    );
    const hmacBuf = await crypto.subtle.sign("HMAC", cryptoKey, bodyData);
    const computedSig = Array.from(new Uint8Array(hmacBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison to avoid leaking timing information about
    // how many leading characters of the signature matched.
    function timingSafeEqual(a: string, b: string): boolean {
      if (a.length !== b.length) return false;
      let mismatch = 0;
      for (let i = 0; i < a.length; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
      }
      return mismatch === 0;
    }

    if (!timingSafeEqual(computedSig, signature)) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (event.event === "charge.success") {
      const tx = event.data;
      const reference = tx.reference;
      const amount = tx.amount / 100;
      const currency = tx.currency;

      const { data: payment } = await supabase
        .from("payments")
        .select("*")
        .eq("paystack_reference", reference)
        .maybeSingle();

      if (payment && payment.status !== "success") {
        // Confirm the amount/currency actually charged matches what we
        // expected for this payment before trusting the webhook's
        // "success" event — don't just trust the event type alone.
        const amountMatches = Math.abs(amount - Number(payment.amount)) < 0.01;
        const currencyMatches = currency === payment.currency;

        if (!amountMatches || !currencyMatches) {
          await supabase
            .from("payments")
            .update({ status: "failed" })
            .eq("id", payment.id);
        } else {
          await supabase
            .from("payments")
            .update({ status: "success" })
            .eq("id", payment.id);

          await supabase.from("notifications").insert({
            user_id: payment.user_id,
            title: "Payment Confirmed",
            message: `Your payment of ₦${amount.toLocaleString()} has been confirmed.`,
            type: "payment",
            link: `/projects/${payment.project_id}`,
          });
        }
      }
    } else if (event.event === "charge.failed") {
      const tx = event.data;
      const reference = tx.reference;

      const { data: payment } = await supabase
        .from("payments")
        .select("*")
        .eq("paystack_reference", reference)
        .maybeSingle();

      if (payment && payment.status === "pending") {
        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("id", payment.id);
      }
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
