import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Configure Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: WebSocket as any
  }
});

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
      currency = 'INR',
      quantity = 1
    } = req.body;

    const finalName = name || userName;
    const finalEmail = email || userEmail;

    if (!finalEmail) {
      return res.status(400).json({ error: 'Missing customer email' });
    }

    let amount = 0;
    let desc = '';
    let shippingFee = 0;
    let isDigital = false;

    if ((plan === 'single' || plan === 'digital_single') && selected_issue) {
      const { data: magazine, error: dbError } = await supabaseAdmin
        .from('magazines')
        .select('single_issue_price, single_issue_price_usd, digital_pdf_price, digital_pdf_price_usd, shipping_inr, shipping_usd, issue_name')
        .eq('id', selected_issue)
        .single();

      if (dbError || !magazine) {
        return res.status(404).json({ error: 'Magazine issue not found' });
      }
      
      if (plan === 'digital_single') {
        amount = currency === 'USD' 
          ? (magazine.digital_pdf_price_usd || 10) * quantity
          : (magazine.digital_pdf_price || 299) * quantity;
        desc = `TAL Digital PDF Purchase: ${magazine.issue_name}`;
        isDigital = true;
      } else {
        amount = currency === 'USD'
          ? (magazine.single_issue_price_usd || 30) * quantity
          : (magazine.single_issue_price || 2500) * quantity;
        desc = `TAL Issue Purchase: ${magazine.issue_name}`;
        
        shippingFee = currency === 'USD'
          ? (magazine.shipping_usd || 15)
          : (magazine.shipping_inr || 150);
      }
    } else if (plan === '1_year') {
      amount = currency === 'USD' ? 400 : 30000;
      desc = 'TAL Subscription: 1 Year';
      shippingFee = currency === 'USD' ? 15 : 150;
    } else {
      return res.status(400).json({ error: 'Invalid plan or missing issue' });
    }

    
    // If amount is already determined in USD, no need to divide by exchangeRate for USD
    // because we dynamically assigned USD price in the above logic.
    // The previous code divided amount / exchangeRate, but now amount is correct per currency.


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
        currency: currency === 'USD' ? 'USD' : 'INR',
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
          (u: any) => u.email?.toLowerCase() === dbPayment.email.toLowerCase()
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
            'Authorization': 'Bearer ' + resendApiKey,
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
                <p>We are delighted to confirm receipt of your payment for <strong>${dbPayment.plan === 'single' ? 'Periodical Issue' : dbPayment.plan === '2_issues' ? '2 Publications Subscription' : dbPayment.plan === '3_issues' ? '3 Publications Subscription' : dbPayment.plan + ' Membership'}</strong>.</p>
                
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
                    <td style="padding: 8px 0; text-align: right;">${dbPayment.plan === 'single' ? 'TAL Magazine Print Issue' : dbPayment.plan === 'digital_single' ? 'TAL Digital PDF Issue' : 'Premium Membership'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eaeaea;">
                    <td style="padding: 8px 0; font-weight: bold; color: #767676;">Contact Phone</td>
                    <td style="padding: 8px 0; text-align: right;">${dbPayment.phone || 'N/A'}</td>
                  </tr>
                  ${dbPayment.address ? `
                  <tr style="border-bottom: 1px solid #eaeaea;">
                    <td style="padding: 8px 0; font-weight: bold; color: #767676;">Shipping Address</td>
                    <td style="padding: 8px 0; text-align: right;">${dbPayment.address}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eaeaea;">
                    <td style="padding: 8px 0; font-weight: bold; color: #767676;">City & Pincode</td>
                    <td style="padding: 8px 0; text-align: right;">${dbPayment.city || ''} - ${dbPayment.pincode || ''}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eaeaea;">
                    <td style="padding: 8px 0; font-weight: bold; color: #767676;">Country</td>
                    <td style="padding: 8px 0; text-align: right;">${dbPayment.country || 'India'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eaeaea;">
                    <td style="padding: 8px 0; font-weight: bold; color: #767676;">Shipping Fee</td>
                    <td style="padding: 8px 0; text-align: right;">INR ${dbPayment.shipping_fee || 0}</td>
                  </tr>
                  ` : ''}
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

        // Send notification to Admin
        console.log('Dispatching Resend admin notification...');
        const adminHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
            <h2 style="font-family: serif; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 20px;">NEW ORDER RECEIVED</h2>
            <p>A new order has been placed on The Art Ledger.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <tr style="border-bottom: 1px solid #eaeaea;">
                <td style="padding: 8px 0; font-weight: bold; color: #767676;">Customer Name</td>
                <td style="padding: 8px 0; text-align: right;">${dbPayment.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eaeaea;">
                <td style="padding: 8px 0; font-weight: bold; color: #767676;">Customer Email</td>
                <td style="padding: 8px 0; text-align: right;">${dbPayment.email}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eaeaea;">
                <td style="padding: 8px 0; font-weight: bold; color: #767676;">Contact Phone</td>
                <td style="padding: 8px 0; text-align: right;">${dbPayment.phone || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eaeaea;">
                <td style="padding: 8px 0; font-weight: bold; color: #767676;">Plan / Item</td>
                <td style="padding: 8px 0; text-align: right;">${dbPayment.plan} (Issue: ${dbPayment.selected_issue || 'N/A'})</td>
              </tr>
              <tr style="border-bottom: 1px solid #eaeaea;">
                <td style="padding: 8px 0; font-weight: bold; color: #767676;">Amount Paid</td>
                <td style="padding: 8px 0; text-align: right;">INR ${dbPayment.amount}</td>
              </tr>
              ${dbPayment.address ? `
              <tr style="border-bottom: 1px solid #eaeaea;">
                <td style="padding: 8px 0; font-weight: bold; color: #767676;">Shipping Address</td>
                <td style="padding: 8px 0; text-align: right;">${dbPayment.address}<br/>${dbPayment.city || ''} - ${dbPayment.pincode || ''}<br/>${dbPayment.country || 'India'}</td>
              </tr>
              ` : ''}
              <tr style="border-bottom: 1px solid #eaeaea;">
                <td style="padding: 8px 0; font-weight: bold; color: #767676;">Transaction ID</td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace;">${razorpayPaymentId}</td>
              </tr>
            </table>
          </div>
        `;

        const adminResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + resendApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'The Art Ledger Admin <noreply@infoartledger.com>',
            to: ['theartledger00@gmail.com'],
            subject: `New Order Alert: ${dbPayment.plan === 'single' ? 'Magazine Print' : dbPayment.plan === 'digital_single' ? 'Digital PDF' : 'Subscription'}`,
            html: adminHtml
          })
        });

        if (adminResponse.ok) {
          console.log('Admin notification email sent successfully');
        } else {
          console.error('Admin Resend API returned error:', await adminResponse.text());
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

// Route: newsletter-subscribe
app.post('/newsletter-subscribe', express.json(), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Insert into newsletter_subscribers
    const { error: insertError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .insert({ email });

    // Note: If duplicate, supabase might return an error, we can ignore or return already subscribed
    if (insertError && insertError.code !== '23505') { // 23505 is unique violation in PG
      console.error('Newsletter insert error:', insertError);
      return res.status(500).json({ error: 'Failed to subscribe' });
    }

    // Send Welcome Email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + resendApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'The Art Ledger <noreply@infoartledger.com>',
            to: [email],
            subject: 'Welcome to The Art Ledger',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
                <h2 style="font-family: serif; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 20px;">THE ART LEDGER</h2>
                <p>Welcome to our editorial journal.</p>
                <p>You have successfully subscribed to The Art Ledger newsletter. Expect curated insights on contemporary fine art, curatorial practices, and exclusive invitations to upcoming exhibitions directly in your inbox.</p>
                <p style="margin-top: 30px; font-size: 12px; color: #767676; border-top: 1px solid #eaeaea; padding-top: 15px;">
                  If you did not request this, you can safely ignore this email.
                </p>
              </div>
            `
          })
        });
        
        if (!resendResponse.ok) {
          const resendErr = await resendResponse.text();
          console.error('Resend API returned error on newsletter:', resendErr);
        }
      } catch (e) {
        console.error('Error sending newsletter email via Resend:', e);
      }
    }

    return res.status(200).json({ status: 'success', message: 'Subscribed successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Route: forgot-password
app.post('/forgot-password', express.json(), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate password recovery link using Supabase Admin
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'http://localhost:5173/admin'
      }
    });

    if (error) {
      console.error('Generate recovery link error:', error);
      return res.status(500).json({ error: 'Failed to generate recovery link' });
    }

    const recoveryUrl = data.properties.action_link;

    // Send the link via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + resendApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'The Art Ledger <noreply@infoartledger.com>',
            to: [email],
            subject: 'Password Recovery: The Art Ledger',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
                <h2 style="font-family: serif; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 20px;">THE ART LEDGER</h2>
                <p>We received a request to reset your password for your portal access.</p>
                <p>Please click the secure link below to reset your password. If you are redirected to the admin portal, it means you have been authenticated securely to set a new password.</p>
                
                <div style="margin: 30px 0;">
                  <a href="${recoveryUrl}" style="background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: bold; display: inline-block;">
                    RESET PASSWORD
                  </a>
                </div>
                
                <p style="margin-top: 30px; font-size: 12px; color: #767676; border-top: 1px solid #eaeaea; padding-top: 15px;">
                  If you did not request a password reset, please ignore this email or contact support if you have concerns.
                </p>
              </div>
            `
          })
        });
        
        if (!resendResponse.ok) {
          const resendErr = await resendResponse.text();
          console.error('Resend API returned error on forgot password:', resendErr);
        }
      } catch (e) {
        console.error('Error sending forgot password email via Resend:', e);
      }
    } else {
      console.warn('RESEND_API_KEY missing, forgot password email not sent.');
    }

    return res.status(200).json({ status: 'success', message: 'Recovery email sent' });
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
