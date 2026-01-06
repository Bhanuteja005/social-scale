# Frontend Razorpay Payment Integration Guide

## Complete Payment Flow

### 1. User Initiates Subscription
```javascript
// Frontend: User selects a plan and clicks "Subscribe"
const handleSubscribe = async (plan) => {
  try {
    // Step 1: Create subscription on backend
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        plan: plan, // 'growth' or 'enterprise'
        billingCycle: 'monthly'
      })
    });

    const { subscription, razorpayOrder } = await response.json();

    // Step 2: Initialize Razorpay Checkout
    initiateRazorpayPayment(subscription, razorpayOrder);
  } catch (error) {
    console.error('Subscription creation failed:', error);
  }
};
```

### 2. Razorpay Checkout Integration
```javascript
const initiateRazorpayPayment = (subscription, razorpayOrder) => {
  const options = {
    key: 'rzp_test_S0YsSSmMBuT5yg', // Your test key
    amount: razorpayOrder.amount, // Amount in paisa
    currency: razorpayOrder.currency,
    order_id: razorpayOrder.id,
    name: 'Social Scale',
    description: `${subscription.plan} Plan Subscription`,
    image: '/logo.png', // Your logo

    handler: function (response) {
      // Step 3: Payment successful - verify on backend
      verifyPayment(response, subscription._id);
    },

    prefill: {
      name: user.name,
      email: user.email,
      contact: user.phone
    },

    theme: {
      color: '#3399cc'
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
};
```

### 3. Payment Verification
```javascript
const verifyPayment = async (razorpayResponse, subscriptionId) => {
  try {
    // Step 4: Verify payment on backend
    const response = await fetch('/api/subscriptions/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        subscriptionId: subscriptionId,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature
      })
    });

    const result = await response.json();

    if (result.success) {
      // Step 5: Success - redirect to success page
      alert('Payment successful! Credits added to your account.');
      window.location.href = '/dashboard';
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
    alert('Payment verification failed. Please contact support.');
  }
};
```

## Frontend Setup Requirements

### 1. Install Razorpay SDK
```bash
npm install razorpay
```

### 2. Add Razorpay Script to HTML
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 3. Complete React Component Example
```jsx
import React, { useState } from 'react';

const SubscriptionPlans = () => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async (plan) => {
    setLoading(true);
    try {
      // Create subscription
      const subResponse = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ plan, billingCycle: 'monthly' })
      });

      const { subscription, razorpayOrder } = await subResponse.json();

      // Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
        name: 'Social Scale',
        description: `${plan} Plan - ${razorpayOrder.amount/100} INR`,

        handler: async (response) => {
          // Verify payment
          const verifyResponse = await fetch('/api/subscriptions/activate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              subscriptionId: subscription._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
          });

          if (verifyResponse.ok) {
            alert('Payment successful! Credits added.');
            window.location.reload();
          }
        },

        prefill: {
          name: 'User Name',
          email: 'user@example.com'
        },

        theme: {
          color: '#4F46E5'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      alert('Payment failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription-plans">
      <div className="plan-card">
        <h3>Growth Plan</h3>
        <p>₹29/month - 2,500 Credits</p>
        <button
          onClick={() => handlePayment('growth')}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Subscribe Now'}
        </button>
      </div>

      <div className="plan-card">
        <h3>Enterprise Plan</h3>
        <p>₹99/month - 10,000 Credits</p>
        <button
          onClick={() => handlePayment('enterprise')}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Subscribe Now'}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
```

## Environment Variables for Frontend

```env
REACT_APP_RAZORPAY_KEY_ID=rzp_test_S0YsSSmMBuT5yg
REACT_APP_API_BASE_URL=http://localhost:3000/api/v1
```

## Complete Payment Flow Summary

1. **User clicks "Subscribe"** → Frontend calls `/api/subscriptions`
2. **Backend creates subscription** → Returns Razorpay order details
3. **Frontend opens Razorpay Checkout** → User enters payment details
4. **User completes payment** → Razorpay processes payment
5. **Razorpay calls success handler** → Frontend calls `/api/subscriptions/activate`
6. **Backend verifies payment** → Activates subscription, adds credits
7. **User redirected to success page** → Credits available for use

## Error Handling

```javascript
// Handle payment failures
const options = {
  // ... other options
  modal: {
    ondismiss: function() {
      alert('Payment cancelled by user');
    }
  },

  callback_url: '/payment/success', // For fallback
  redirect: true // Enable redirects for mobile
};
```

## Testing the Complete Flow

1. Start your backend server
2. Start your frontend development server
3. Login to your application
4. Click "Subscribe" on any plan
5. Complete payment with test card:
   - Card: 4111 1111 1111 1111
   - Expiry: 12/25
   - CVV: 123
6. Verify credits are added to account

The integration is complete and ready for production! 🚀