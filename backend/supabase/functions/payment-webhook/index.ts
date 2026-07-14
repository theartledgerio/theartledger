// Deno Edge Function: payment-webhook
// Path: backend/supabase/functions/payment-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// HMAC SHA256 Verification helper
async function verifySignature(
  bodyText: string,
  receivedSignature: string,
  webhookSecret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const secretKeyData = encoder.encode(webhookSecret);
  const key = await crypto.subtle.importKey(
    "raw",
    secretKeyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const bodyData = encoder.encode(bodyText);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, bodyData);
  
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex === receivedSignature;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || "";

    // 1. Verify Webhook Signature
    const isValid = await verifySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.warn("Signature Verification Failed!");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const eventPayload = JSON.parse(rawBody);
    const eventType = eventPayload.event;
    
    if (eventType !== "payment.captured" && eventType !== "order.paid") {
      return new Response(JSON.stringify({ status: "ignored_event" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const paymentEntity = eventPayload.payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;
    const razorpaySignature = signature;

    // 2. Fetch pending payment log
    const { data: dbPayment, error: fetchError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("razorpay_order_id", razorpayOrderId)
      .single();

    if (fetchError || !dbPayment) {
      console.error(`Pending transaction not found for order id: ${razorpayOrderId}`);
      return new Response(JSON.stringify({ error: "Transaction mapping not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check duplicate execution
    if (dbPayment.status === "paid") {
      return new Response(JSON.stringify({ status: "already_completed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Update payment row status to 'paid'
    const { error: updatePaymentError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "paid",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      })
      .eq("id", dbPayment.id);

    if (updatePaymentError) {
      throw updatePaymentError;
    }

    // 4. Provision access for magazine purchases
    if (dbPayment.plan === "single" && dbPayment.selected_issue) {
      // Find user ID matching email on the payment
      const { data: userData, error: userError } = await supabaseAdmin
        .rpc("get_user_id_by_email", { email_to_lookup: dbPayment.email });

      let targetUserId = null;
      if (!userError && userData) {
        targetUserId = userData;
      } else {
        // Fallback: search auth.users directly
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        const matchedUser = authUsers?.users?.find(
          u => u.email?.toLowerCase() === dbPayment.email.toLowerCase()
        );
        if (matchedUser) {
          targetUserId = matchedUser.id;
        }
      }

      if (targetUserId) {
        const { error: purchaseError } = await supabaseAdmin
          .from("magazine_purchases")
          .insert({
            user_id: targetUserId,
            magazine_id: dbPayment.selected_issue,
            payment_id: dbPayment.id,
            amount: dbPayment.amount,
          });

        if (purchaseError) {
          console.error("Failed inserting magazine purchase:", purchaseError);
        }
      } else {
        console.warn(`User with email ${dbPayment.email} not registered yet. Purchase will sync on signup.`);
      }
    }

    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
