import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

app.use(cors());

// Configure Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Basic health check
app.get('/', (req, res) => {
  res.json({ message: 'The Art Ledger Backend API is running on port 3003.' });
});

// Route: payment-create
app.post('/payment-create', express.json(), async (req, res) => {
  try {
    let userId = null;
    let userName = 'Collector';
    let userEmail = '';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (!authError && user) {
          userId = user.id;
          userName = user.user_metadata?.full_name || 'Collector';
          userEmail = user.email || '';
        }
      } catch (authErr) {
        console.warn('Token verification failed, proceeding as guest:', authErr);
      }
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
    } = req.body;

    const finalName = name || userName;
    const finalEmail = email || userEmail;

    if (!finalEmail) {
      return res.status(400).json({ error: 'Missing customer email' });
    }

    let amount = 0;
    let desc = '';

    if (plan === 'single' && selected_issue) {
      const { data: magazine, error: dbError } = await supabaseAdmin
        .from('magazines')
        .select('single_issue_price, issue_name')
        .eq('id', selected_issue)
        .single();

      if (dbError || !magazine) {
        return res.status(404).json({ error: 'Magazine issue not found' });
      }
      amount = 499 * quantity;
      desc = `TAL Issue Purchase: ${magazine.issue_name}`;
    } else if (plan === 'quarterly' || plan === 'annual') {
      const { data: settings, error: dbError } = await supabaseAdmin
        .from('subscription_settings')
        .select('quarterly_price, annual_price')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (dbError || !settings) {
        return res.status(404).json({ error: 'Subscription settings not found' });
      }

      if (plan === 'quarterly') {
        amount = Number(settings.quarterly_price);
        desc = 'TAL Subscription: Quarterly Membership';
      } else {
        amount = Number(settings.annual_price);
        desc = 'TAL Subscription: Annual VIP Membership';
      }
    } else {
      return res.status(400).json({ error: 'Invalid plan or missing issue' });
    }

    let shippingFee = 0;
    if (plan === 'single' || plan === 'quarterly' || plan === 'annual') {
      const isIndia = (country || 'India').toLowerCase().trim() === 'india';
      shippingFee = isIndia ? 150 : 2500;
    }

    const totalAmount = amount + shippingFee;
    const amountInSubunits = Math.round(totalAmount * 100);

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    const authString = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        currency: 'INR',
        receipt: `receipt_tal_${Date.now()}`,
        notes: {
          userId: userId || '',
          plan: plan,
          selectedIssue: selected_issue || '',
          name: finalName,
          email: finalEmail
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      return res.status(502).json({ error: 'Razorpay order creation failed', details: errorText });
    }

    const orderData = await razorpayResponse.json();

    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        name: finalName,
        email: finalEmail,
        phone: phone || '',
        plan: plan,
        amount: totalAmount,
        razorpay_order_id: orderData.id,
        status: 'created',
        address: address || null,
        city: city || null,
        pincode: pincode || null,
        country: country || 'India',
        selected_issue: selected_issue || null,
        quantity: quantity,
        shipping_fee: shippingFee
      });

    if (insertError) {
      console.error('Failed logging payment in ledger:', insertError);
    }

    return res.status(200).json({
      order_id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      description: desc,
      key_id: razorpayKeyId
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Route: payment-webhook
app.post('/payment-webhook', express.text({ type: 'application/json' }), async (req, res) => {
  try {
    const rawBody = req.body;
    const signature = req.headers['x-razorpay-signature'] as string || '';
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    // Verify signature only if webhookSecret is configured
    if (webhookSecret) {
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(rawBody);
      const hashHex = hmac.digest('hex');

      if (hashHex !== signature) {
        console.warn('Signature Verification Failed!');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } else {
      console.log('Skipping Webhook signature check: RAZORPAY_WEBHOOK_SECRET is empty.');
    }

    const eventPayload = JSON.parse(rawBody);
    const eventType = eventPayload.event;

    if (eventType !== 'payment.captured' && eventType !== 'order.paid') {
      return res.status(200).json({ status: 'ignored_event' });
    }

    const paymentEntity = eventPayload.payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    // Fetch pending payment log
    const { data: dbPayment, error: fetchError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpayOrderId)
      .single();

    if (fetchError || !dbPayment) {
      console.error(`Pending transaction not found for order id: ${razorpayOrderId}`);
      return res.status(404).json({ error: 'Transaction mapping not found' });
    }

    // Check duplicate execution
    if (dbPayment.status === 'paid') {
      return res.status(200).json({ status: 'already_completed' });
    }

    // Update payment row status to 'paid'
    const { error: updatePaymentError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'paid',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: signature,
      })
      .eq('id', dbPayment.id);

    if (updatePaymentError) {
      throw updatePaymentError;
    }

    // Provision access for magazine purchases
    if (dbPayment.plan === 'single' && dbPayment.selected_issue) {
      const { data: userData, error: userError } = await supabaseAdmin
        .rpc('get_user_id_by_email', { email_to_lookup: dbPayment.email });

      let targetUserId = null;
      if (!userError && userData) {
        targetUserId = userData;
      } else {
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
          .from('magazine_purchases')
          .insert({
            user_id: targetUserId,
            magazine_id: dbPayment.selected_issue,
            payment_id: dbPayment.id,
            amount: dbPayment.amount,
          });

        if (purchaseError) {
          console.error('Failed inserting magazine purchase:', purchaseError);
        }
      } else {
        console.warn(`User with email ${dbPayment.email} not registered yet. Purchase will sync on signup.`);
      }
    }

    // Send email confirmation using Resend API
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        console.log(`Dispatching Resend receipt email to ${dbPayment.email}...`);
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'The Art Ledger <noreply@infoartledger.com>',
            to: [dbPayment.email],
            subject: `Thank you for your purchase: The Art Ledger`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
                <h2 style="font-family: serif; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 20px;">THE ART LEDGER</h2>
                <p>Hello ${dbPayment.name || 'Collector'},</p>
                <p>We are delighted to confirm receipt of your payment for <strong>${dbPayment.plan === 'single' ? 'Periodical Issue' : dbPayment.plan + ' Membership'}</strong>.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                  <tr style="border-bottom: 1px solid #eaeaea;">
                    <td style="padding: 8px 0; font-weight: bold; color: #767676;">Transaction ID</td>
                    <td style="padding: 8px 0; text-align: right; font-family: monospace;">${razorpayPaymentId}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eaeaea;">
                    <td style="padding: 8px 0; font-weight: bold; color: #767676;">Amount Paid</td>
                    <td style="padding: 8px 0; text-align: right;">INR ${dbPayment.amount}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eaeaea;">
                    <td style="padding: 8px 0; font-weight: bold; color: #767676;">Item Description</td>
                    <td style="padding: 8px 0; text-align: right;">${dbPayment.plan === 'single' ? 'TAL Magazine Print Issue' : 'Premium Membership'}</td>
                  </tr>
                </table>
                
                <p>Your subscription features and digital ledger files have been unlocked in your collector workspace. If you purchased a physical print issue, it will be dispatched to your shipping address shortly.</p>
                <p style="margin-top: 30px; font-size: 12px; color: #767676; border-top: 1px solid #eaeaea; padding-top: 15px;">
                  This is an automated receipt email. If you have any inquiries, contact curations@infoartledger.com.
                </p>
              </div>
            `
          })
        });
        
        if (resendResponse.ok) {
          console.log('Confirmation email sent successfully via Resend');
        } else {
          const resendErr = await resendResponse.text();
          console.error('Resend API returned error:', resendErr);
        }
      } catch (e) {
        console.error('Error sending email via Resend:', e);
      }
    } else {
      console.warn('RESEND_API_KEY is not defined. Skipping email dispatch.');
    }

    return res.status(200).json({ status: 'success' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Route: magazine-download
app.get('/magazine-download', async (req, res) => {
  try {
    const magazineId = req.query.magazine_id as string;
    if (!magazineId) {
      return res.status(400).json({ error: 'Missing magazine_id param' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    // Check if user is Admin
    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    let hasAccess = isAdmin === true;

    // Check if user has access to the magazine issue via SQL has_magazine_access function
    if (!hasAccess) {
      const { data: dbAccess, error: accessError } = await supabaseClient.rpc('has_magazine_access', {
        _user_id: user.id,
        _magazine_id: magazineId
      });

      if (!accessError && dbAccess === true) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Purchase issue or active subscription required' });
    }

    // Fetch magazine PDF storage path
    const { data: magazine, error: dbError } = await supabaseClient
      .from('magazines')
      .select('pdf_storage_path, issue_name')
      .eq('id', magazineId)
      .single();

    if (dbError || !magazine) {
      return res.status(404).json({ error: 'Magazine issue not found in registry' });
    }

    const path = magazine.pdf_storage_path || `issues/${magazineId}.pdf`;

    const { data: storageData, error: storageError } = await supabaseAdmin
      .storage
      .from('private-magazines')
      .createSignedUrl(path, 60);

    if (storageError || !storageData) {
      console.error('Storage signed URL generation error:', storageError);
      return res.status(500).json({ error: 'Failed generating secure download URL' });
    }

    return res.status(200).json({ download_url: storageData.signedUrl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
