#!/usr/bin/env node
/**
 * Test order creation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testOrderCreation() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testuser@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.data.accessToken;
    console.log('✓ Logged in successfully');

    console.log('� Getting available services...');
    const servicesResponse = await axios.get(`${BASE_URL}/orders/services`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Available services count:', servicesResponse.data.data.length);
    console.log('First service:', JSON.stringify(servicesResponse.data.data[0], null, 2));
    const instagramServices = servicesResponse.data.data.filter(s => s.name && s.name.includes('Instagram Followers'));
    console.log('Instagram Followers services:', instagramServices.length);
    if (instagramServices.length > 0) {
      console.log('First Instagram service:', instagramServices[0]);
    }
    const orderData = {
      service: '2279', // Instagram Followers [Good Quality] [30D Refill]
      link: 'https://www.instagram.com/testuser',
      quantity: 10
    };

    const orderResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✓ Order created successfully!');
    console.log('Order ID:', orderResponse.data.data.order._id);
    console.log('Status:', orderResponse.data.data.order.status);
    console.log('Credits deducted:', orderResponse.data.data.creditsDeducted);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testOrderCreation();