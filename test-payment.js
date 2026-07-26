import fetch from 'node-fetch';

async function testPayment() {
  const url = process.env.API_URL || 'http://13.232.65.37:3003/payment-create';
  
  const payload = {
    plan: '1_year',
    name: 'Test Collector',
    email: 'test@example.com',
    address: '123 Fake St',
    city: 'Mumbai',
    pincode: '400001',
    country: 'India',
    currency: 'INR',
    quantity: 1
  };

  try {
    console.log('Sending request to', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const status = response.status;
    const text = await response.text();

    console.log('Response Status:', status);
    console.log('Response Body:', text);
    
    if (status === 200) {
      console.log('✅ Payment order successfully generated!');
    } else {
      console.log('❌ Payment order failed.');
    }

  } catch (error) {
    console.error('Error during test:', error);
  }
}

testPayment();
