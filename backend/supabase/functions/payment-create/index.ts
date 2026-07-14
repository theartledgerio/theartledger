// Deno Edge Function: payment-create
// Path: backend/supabase/functions/payment-create/index.ts

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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get authorized user
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

    const { 
      plan, 
      selected_issue, 
      name, 
      email, 
      phone, 
      address, 
      city, 
      pincode, 
      country, 
      quantity = 1 
    } = await req.json();

    let amount = 0;
    let desc = "";

    // 1. Determine price based on plan or selected issue
    if (plan === "single" && selected_issue) {
      const { data: magazine, error: dbError } = await supabaseClient
        .from("magazines")
        .select("single_issue_price, issue_name")
        .eq("id", selected_issue)
        .single();

      if (dbError || !magazine) {
        return new Response(JSON.stringify({ error: "Magazine issue not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      amount = Number(magazine.single_issue_price) * quantity;
      desc = `TAL Issue Purchase: ${magazine.issue_name}`;
    } else if (plan === "quarterly" || plan === "annual") {
      const { data: settings, error: dbError } = await supabaseClient
        .from("subscription_settings")
        .select("quarterly_price, annual_price")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (dbError || !settings) {
        return new Response(JSON.stringify({ error: "Subscription settings not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (plan === "quarterly") {
        amount = Number(settings.quarterly_price);
        desc = "TAL Subscription: Quarterly Membership";
      } else {
        amount = Number(settings.annual_price);
        desc = "TAL Subscription: Annual VIP Membership";
      }
    } else {
      return new Response(JSON.stringify({ error: "Invalid plan or missing issue" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Include shipping fee if applicable (e.g. print plan)
    let shippingFee = 0;
    if (plan === "single" || plan === "quarterly" || plan === "annual") {
      const { data: shipping } = await supabaseClient
        .from("shipping_settings")
        .select("india_fee, international_fee, india_free_threshold")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (shipping) {
        const isIndia = (country || "India").toLowerCase().includes("india");
        const threshold = Number(shipping.india_free_threshold);
        
        if (isIndia) {
          shippingFee = amount >= threshold ? 0 : Number(shipping.india_fee);
        } else {
          shippingFee = Number(shipping.international_fee);
        }
      }
    }

    const totalAmount = amount + shippingFee;
    const amountInSubunits = Math.round(totalAmount * 100); // Razorpay amount in cents/paise

    // 2. Call Razorpay API to generate order
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    const authString = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        currency: "INR",
        receipt: `receipt_tal_${Date.now()}`,
        notes: {
          userId: user.id,
          plan: plan,
          selectedIssue: selected_issue || "",
          name: name,
          email: email
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      return new Response(JSON.stringify({ error: "Razorpay order creation failed", details: errorText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderData = await razorpayResponse.json();

    // 3. Log initiated payment status in PostgreSQL
    const { error: insertError } = await supabaseClient
      .from("payments")
      .insert({
        name: name || user.raw_user_meta_data?.full_name || "Collector",
        email: email || user.email || "",
        phone: phone || "",
        plan: plan,
        amount: totalAmount,
        razorpay_order_id: orderData.id,
        status: "created",
        address: address || null,
        city: city || null,
        pincode: pincode || null,
        country: country || "India",
        selected_issue: selected_issue || null,
        quantity: quantity,
        shipping_fee: shippingFee
      });

    if (insertError) {
      console.error("Failed logging payment in ledger:", insertError);
    }

    return new Response(JSON.stringify({
      order_id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      description: desc,
      key_id: razorpayKeyId
    }), {
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
