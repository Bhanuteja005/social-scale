require("dotenv").config();
const axios = require("axios");
const config = require("../src/config/env");

async function testFampageAPI() {
  try {
    console.log("Testing Fampage API endpoints...");

    // Test status endpoint with order parameter
    console.log("\n1. Testing status endpoint with order parameter:");
    try {
      const statusUrl = `${config.fampage.baseUrl}?action=status&key=${config.fampage.apiKey}&order=206665505`;
      const statusResponse = await axios.get(statusUrl);
      console.log("Status endpoint response:", JSON.stringify(statusResponse.data, null, 2));
    } catch (error) {
      console.log("Status endpoint failed:", error.response?.data || error.message);
    }

    // Test status endpoint with orders parameter (multiple orders)
    console.log("\n2. Testing status endpoint with orders parameter:");
    try {
      const statusUrl = `${config.fampage.baseUrl}?action=status&key=${config.fampage.apiKey}&orders=206665505`;
      const statusResponse = await axios.get(statusUrl);
      console.log("Status endpoint response:", JSON.stringify(statusResponse.data, null, 2));
    } catch (error) {
      console.log("Status endpoint failed:", error.response?.data || error.message);
    }

    // Test different action names
    console.log("\n3. Testing different action names:");
    const actions = ['order', 'orders', 'check', 'balance'];
    for (const action of actions) {
      try {
        const url = `${config.fampage.baseUrl}?action=${action}&key=${config.fampage.apiKey}`;
        if (action === 'order') {
          url += '&order=206665505';
        }
        const response = await axios.get(url);
        console.log(`${action} endpoint response:`, JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.log(`${action} endpoint failed:`, error.response?.data?.error || error.message);
      }
    }

  } catch (error) {
    console.error("Error testing Fampage API:", error.message);
  }
}

testFampageAPI();