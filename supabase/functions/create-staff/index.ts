import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Missing or invalid Authorization header" }, 401);
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate caller via getUser (service role can verify any JWT)
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await serviceClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const callerId = userData.user.id;

    // Parse body
    const { email, full_name, role_function } = await req.json();
    if (!email || !full_name) {
      return json({ error: "email and full_name are required" }, 400);
    }

    // Verify caller is owner
    const { data: callerMembership } = await serviceClient
      .from("memberships")
      .select("company_id")
      .eq("user_id", callerId)
      .eq("active", true)
      .eq("role", "owner")
      .limit(1)
      .single();

    if (!callerMembership) {
      return json({ error: "Only owners can create staff" }, 403);
    }

    const companyId = callerMembership.company_id;
    const tempPassword = crypto.randomUUID().slice(0, 12) + "A1!";

    // Create auth user
    const { data: newUser, error: createErr } =
      await serviceClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name },
      });

    if (createErr) {
      const status = createErr.message?.toLowerCase().includes("already") ? 409 : 400;
      return json({ error: createErr.message }, status);
    }

    const userId = newUser.user.id;

    // Create profile + membership
    await serviceClient.from("profiles").insert({
      user_id: userId,
      full_name,
    });

    await serviceClient.from("memberships").insert({
      company_id: companyId,
      user_id: userId,
      role: "staff",
      invited_by: callerId,
    });

    return json({
      success: true,
      user_id: userId,
      temp_password: tempPassword,
    });
  } catch (err) {
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
