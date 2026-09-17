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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const reference = url.searchParams.get("reference") || (await req.json().catch(() => ({}))).reference;

    if (!reference) {
      return new Response(JSON.stringify({ error: "Reference is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      return new Response(JSON.stringify({ error: paystackData.message || "Verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tx = paystackData.data;
    const isSuccess = tx.status === "success";
    const verifiedAmount = tx.amount / 100;
    const verifiedCurrency = tx.currency;

    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .select("*")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (payErr || !payment) {
      return new Response(JSON.stringify({ error: "Payment record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payment.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Never mark a payment successful just because Paystack says the
    // transaction succeeded — also confirm the amount and currency Paystack
    // actually charged match what we expected for this payment record.
    // This guards against any future paystack-init bug (or a stale/reused
    // reference) resulting in a mismatched charge being accepted.
    const amountMatches = Math.abs(verifiedAmount - Number(payment.amount)) < 0.01;
    const currencyMatches = verifiedCurrency === payment.currency;

    if (isSuccess && !(amountMatches && currencyMatches)) {
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
      return new Response(
        JSON.stringify({ error: "Payment amount or currency does not match the expected value" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (isSuccess && payment.status !== "success") {
      await supabase
        .from("payments")
        .update({ status: "success" })
        .eq("id", payment.id);

      await supabase.from("notifications").insert({
        user_id: payment.user_id,
        title: "Payment Confirmed",
        message: `Your payment of ₦${verifiedAmount.toLocaleString()} has been confirmed.`,
        type: "payment",
        link: `/projects/${payment.project_id}`,
      });
    } else if (!isSuccess && payment.status === "pending") {
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
    }

    return new Response(
      JSON.stringify({
        status: isSuccess ? "success" : "failed",
        amount: verifiedAmount,
        reference,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
