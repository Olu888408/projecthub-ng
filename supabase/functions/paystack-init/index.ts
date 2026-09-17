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

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    const body = await req.json();
    // NOTE: we deliberately no longer trust `body.amount`. The client may only
    // tell us *which* project/package it wants to pay for — the price itself
    // is always looked up server-side below, from the database.
    const { projectId, packageId } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: "projectId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("id, user_id, package_id, package:packages(id, price)")
      .eq("id", projectId)
      .maybeSingle();

    if (projError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (project.user_id !== userId) {
      return new Response(JSON.stringify({ error: "You do not own this project" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve the package to charge for: prefer the one already attached to
    // the project; fall back to an explicitly requested packageId only if it
    // matches what's on the project (prevents swapping in a cheaper package
    // id that isn't actually this project's package).
    const effectivePackageId = project.package_id ?? packageId ?? null;
    if (packageId && project.package_id && packageId !== project.package_id) {
      return new Response(
        JSON.stringify({ error: "packageId does not match this project's assigned package" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // The price ALWAYS comes from the database, never from the client.
    const packagePrice = Array.isArray(project.package)
      ? project.package[0]?.price
      : (project.package as { price?: number } | null)?.price;

    if (!packagePrice || packagePrice <= 0) {
      return new Response(
        JSON.stringify({ error: "This project has no valid package price to charge." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const amount = packagePrice;

    const reference = `phn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    if (!body.callbackUrl) {
      return new Response(JSON.stringify({ error: "callbackUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Don't blindly trust an arbitrary client-supplied redirect target —
    // only allow it if its origin matches our known app origin. Set
    // APP_URL in the edge function's environment (e.g.
    // https://projecthubng.netlify.app); falls back to the known
    // production domain if APP_URL isn't configured.
    const allowedOrigin = Deno.env.get("APP_URL") || "https://projecthubng.netlify.app";
    let callbackUrl: string;
    try {
      const requested = new URL(body.callbackUrl);
      const allowed = new URL(allowedOrigin);
      if (requested.origin !== allowed.origin) {
        return new Response(JSON.stringify({ error: "callbackUrl origin is not allowed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      callbackUrl = requested.toString();
    } catch {
      return new Response(JSON.stringify({ error: "callbackUrl is not a valid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        amount: Math.round(amount * 100),
        reference,
        callback_url: callbackUrl,
        metadata: {
          projectId,
          userId,
          packageId: effectivePackageId,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok) {
      return new Response(JSON.stringify({ error: paystackData.message || "Paystack initialization failed" }), {
        status: paystackRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: payError } = await supabase.from("payments").insert({
      project_id: projectId,
      user_id: userId,
      amount,
      currency: "NGN",
      package_id: effectivePackageId,
      paystack_reference: reference,
      status: "pending",
    });

    if (payError) {
      return new Response(JSON.stringify({ error: "Failed to create payment record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        authorizationUrl: paystackData.data.authorization_url,
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
