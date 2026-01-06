import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Subscription {
  _id: string;
  plan: string;
  credits: number;
  price: number;
  status: string;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

const Subscription: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [userCredits, setUserCredits] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setDataLoading(true);
    try {
      // Load pricing plans
      const plansResponse = await apiService.getSubscriptionPlans();
      setPlans(plansResponse?.data?.plans || []);

      // Load user credits
      const creditsResponse = await apiService.getUserCredits();
      setUserCredits(creditsResponse?.data || null);

      // Load user subscriptions
      const subsResponse = await apiService.getUserSubscriptions();
      setSubscriptions(subsResponse?.data?.subscriptions || []);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set default values on error
      setPlans([]);
      setUserCredits(null);
      setSubscriptions([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubscribe = async (plan: string) => {
    setLoading(true);
    try {
      // Step 1: Create subscription on backend
      const response = await apiService.createSubscription({
        plan: plan,
        billingCycle: 'monthly',
        paymentMethod: 'razorpay'
      });

      const { subscription, razorpayOrder } = response.data;

      // Step 2: Initialize Razorpay payment
      initiateRazorpayPayment(subscription, razorpayOrder);

    } catch (error: any) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const initiateRazorpayPayment = (subscription: Subscription, razorpayOrder: RazorpayOrder) => {
    const options = {
      key: import.meta.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_S0YsSSmMBuT5yg',
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order_id: razorpayOrder.id,
      name: 'Social Scale',
      description: `${subscription.plan.toUpperCase()} Plan Subscription - ₹${razorpayOrder.amount/100}`,
      image: '/logo.png',

      // Payment success handler
      handler: function (response: any) {
        console.log('Payment successful:', response);
        verifyPayment(response, subscription._id);
      },

      // Prefill user details
      prefill: {
        name: user?.name || user?.email?.split('@')[0] || 'User',
        email: user?.email || '',
        contact: user?.phone || ''
      },

      // Theme
      theme: {
        color: '#4F46E5'
      },

      // Handle payment failure
      modal: {
        ondismiss: function() {
          alert('Payment cancelled by user');
        }
      }
    };

    const rzp = new window.Razorpay(options);

    // Handle payment failure
    rzp.on('payment.failed', function (response: any) {
      console.error('Payment failed:', response.error);
      alert('Payment failed: ' + response.error.description);
    });

    rzp.open();
  };

  const verifyPayment = async (razorpayResponse: any, subscriptionId: string) => {
    try {
      const response = await apiService.activateSubscription({
        subscriptionId: subscriptionId,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature
      });

      if (response.data.success) {
        alert('🎉 Payment successful! Credits added to your account.');
        loadData(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Payment verification failed');
      }

    } catch (error: any) {
      console.error('Verification error:', error);
      alert('Payment verification failed. Please contact support.');
    }
  };

  return (
    <div className="subscription-page">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscription Plans</h1>

        {/* Current Credits */}
        {userCredits && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Your Credits</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userCredits.balance}</div>
                <div className="text-sm text-blue-600">Available Credits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userCredits.totalPurchased}</div>
                <div className="text-sm text-green-600">Total Purchased</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{userCredits.totalSpent}</div>
                <div className="text-sm text-red-600">Total Spent</div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {plans && plans.length > 0 ? (
            plans.map((plan) => (
            <div key={plan.name} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 capitalize">{plan.name} Plan</h3>
              <div className="text-3xl font-bold text-indigo-600 mb-4">
                ₹{plan.price}<span className="text-lg font-normal text-gray-500">/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  {plan.credits.toLocaleString()} Credits
                </li>
                {plan.features?.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.name)}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Subscribe Now'}
              </button>
            </div>
          ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">
                {dataLoading ? 'Loading subscription plans...' : 'No subscription plans available.'}
              </p>
            </div>
          )}
        </div>

        {/* Current Subscriptions */}
        {subscriptions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Subscriptions</h2>
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div key={sub._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 capitalize">{sub.plan} Plan</div>
                    <div className="text-sm text-gray-500">{sub.credits} Credits</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    sub.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : sub.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {sub.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Mode Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Test Mode Active</h3>
          <p className="text-yellow-700 mb-2">Use these test card details for payment:</p>
          <div className="font-mono text-sm text-yellow-800">
            <p>Card Number: 4111 1111 1111 1111</p>
            <p>Expiry: Any future date (e.g., 12/25)</p>
            <p>CVV: 123</p>
            <p>Name: Any name</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;