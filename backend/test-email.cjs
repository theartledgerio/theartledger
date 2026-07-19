const dotenv = require('dotenv');
dotenv.config();

async function testEmail() {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not defined in .env');
    process.exit(1);
  }

  const adminHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
      <h2 style="font-family: serif; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 20px;">NEW ORDER RECEIVED (TEST)</h2>
      <p>A test order has been placed on The Art Ledger.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr style="border-bottom: 1px solid #eaeaea;">
          <td style="padding: 8px 0; font-weight: bold; color: #767676;">Customer Name</td>
          <td style="padding: 8px 0; text-align: right;">Test User</td>
        </tr>
        <tr style="border-bottom: 1px solid #eaeaea;">
          <td style="padding: 8px 0; font-weight: bold; color: #767676;">Plan / Item</td>
          <td style="padding: 8px 0; text-align: right;">single (Issue: 1)</td>
        </tr>
      </table>
    </div>
  `;

  try {
    const adminResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + resendApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'The Art Ledger Admin <noreply@infoartledger.com>',
        to: ['theartledger00@gmail.com'],
        subject: 'New Order Alert (Test): Magazine Print',
        html: adminHtml
      })
    });

    if (adminResponse.ok) {
      console.log('Test admin notification email sent successfully!');
    } else {
      const errText = await adminResponse.text();
      console.error('Failed to send email:', adminResponse.status, errText);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testEmail();
