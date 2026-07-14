// Deno Edge Function: magazine-download
// Path: backend/supabase/functions/magazine-download/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const magazineId = url.searchParams.get("magazine_id");

    if (!magazineId) {
      return new Response(JSON.stringify({ error: "Missing magazine_id param" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get calling user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Check if user is Admin
    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });

    let hasAccess = isAdmin === true;

    // 2. Check if user has access to the magazine issue via SQL has_magazine_access function
    if (!hasAccess) {
      const { data: dbAccess, error: accessError } = await supabaseClient.rpc("has_magazine_access", {
        _user_id: user.id,
        _magazine_id: magazineId
      });

      if (!accessError && dbAccess === true) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Forbidden: Purchase issue or active subscription required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch magazine PDF storage path
    const { data: magazine, error: dbError } = await supabaseClient
      .from("magazines")
      .select("pdf_storage_path, issue_name")
      .eq("id", magazineId)
      .single();

    if (dbError || !magazine) {
      // In the old schema, pdf_storage_path might be stored under preview_pdf_url or we store complete pdf separately.
      // We assume they are stored in 'private-magazines' bucket using 'pdf_storage_path' or slug based path.
      return new Response(JSON.stringify({ error: "Magazine issue not found in registry" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine path
    const path = magazine.pdf_storage_path || `issues/${magazineId}.pdf`;

    // Initialize Admin Client to bypass RLS and generate Signed URL
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: storageData, error: storageError } = await supabaseAdmin
      .storage
      .from("private-magazines")
      .createSignedUrl(path, 60);

    if (storageError || !storageData) {
      console.error("Storage signed URL generation error:", storageError);
      return new Response(JSON.stringify({ error: "Failed generating secure download URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ download_url: storageData.signedUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
