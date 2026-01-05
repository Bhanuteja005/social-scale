require("dotenv").config();
const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:3000/api/v1";
let authToken = "";
let companyId = "";

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${"=".repeat(60)}`, "cyan");
  log(`STEP ${step}: ${message}`, "cyan");
  log("=".repeat(60), "cyan");
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      validateStatus: function (status) {
        return status < 500; // Resolve for all status codes less than 500
      },
    };

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    // Check if the response is successful
    if (response.status >= 200 && response.status < 300) {
      return { success: true, data: response.data };
    } else {
      return {
        success: false,
        error: response.data,
        status: response.status,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Test functions
async function test1_Login() {
  logStep(1, "Login as SUPER_ADMIN");
  
  const result = await apiRequest("POST", "/auth/login", {
    email: "admin@socialscale.com",
    password: "Admin@12345",
  });

  if (result.success && result.data.data.accessToken) {
    authToken = result.data.data.accessToken;
    logSuccess("Login successful");
    logInfo(`Token: ${authToken.substring(0, 50)}...`);
    logInfo(`User: ${result.data.data.user.email}`);
    logInfo(`Role: ${result.data.data.user.role}`);
    return true;
  } else {
    logError("Login failed");
    console.log(result.error);
    return false;
  }
}

async function test2_GetCompanies() {
  logStep(2, "Get Companies List");
  
  const result = await apiRequest("GET", "/companies");

  // Handle both direct data and nested data structure
  const companies = result.data?.data?.data || result.data?.data?.companies || result.data?.data || [];
  
  if (result.success && companies.length > 0) {
    companyId = companies[0].companyId;
    logSuccess(`Found ${companies.length} company(ies)`);
    logInfo(`Using Company ID: ${companyId}`);
    logInfo(`Company Name: ${companies[0].name}`);
    return true;
  } else {
    logError("Failed to get companies or no companies found");
    console.log("Response:", JSON.stringify(result, null, 2));
    return false;
  }
}

async function test3_CheckFampayBalance() {
  logStep(3, "Check Fampay Balance");
  
  const result = await apiRequest("GET", "/api-integrations/balance");

  if (result.success) {
    logSuccess("Balance retrieved successfully");
    logInfo(`Balance: ${result.data.data?.balance || "N/A"}`);
    logInfo(`Currency: ${result.data.data?.currency || "N/A"}`);
    return true;
  } else {
    logError("Failed to get balance");
    console.log(result.error);
    return false;
  }
}

async function test4_GetFampayServices() {
  logStep(4, "Get Fampay Services List");
  
  const result = await apiRequest("GET", "/api-integrations/services");

  if (result.success && result.data.data) {
    logSuccess("Services retrieved successfully");
    
    if (result.data.data.categorized) {
      logInfo(`Total Services: ${result.data.data.total}`);
      logInfo(`Networks: ${result.data.data.networks.join(", ")}`);
      
      // Show first few services from Instagram if available
      const instagramServices = result.data.data.categorized.find(
        cat => cat.network.toLowerCase().includes("instagram")
      );
      
      if (instagramServices && instagramServices.services.length > 0) {
        log("\nSample Instagram Services:", "yellow");
        instagramServices.services.slice(0, 3).forEach(service => {
          log(`  - [${service.service}] ${service.name}`, "yellow");
          log(`    Type: ${service.type}, Rate: ${service.rate}/1000`, "yellow");
          log(`    Min: ${service.min}, Max: ${service.max}`, "yellow");
        });
      }
    }
    return true;
  } else {
    logError("Failed to get services");
    console.log(result.error);
    return false;
  }
}

async function test5_CreateOrder() {
  logStep(5, "Create Order (Instagram Followers - TEST)");
  
  log("\n⚠️  WARNING: This will create a REAL order on Fampay!", "yellow");
  log("Make sure you have sufficient balance and want to proceed.", "yellow");
  log("You can skip this step by commenting it out in the script.\n", "yellow");
  
  // IMPORTANT: Modify these values for your test
  const orderData = {
    companyId: companyId,
    service: 1, // Service ID from Fampay (check services list first!)
    link: "https://www.instagram.com/instagram/", // Target Instagram profile
    quantity: 10, // Minimum quantity (adjust based on service)
    serviceName: "Instagram Followers",
    serviceType: "follow",
    cost: 0.1, // Estimated cost (will be calculated if not provided)
    invoiceMultiplier: 8, // Invoice multiplier
  };

  logInfo("Order Details:");
  console.log(JSON.stringify(orderData, null, 2));
  
  // Uncomment the following lines to actually create an order
  /*
  const result = await apiRequest("POST", "/api-integrations/orders", orderData);

  if (result.success) {
    logSuccess("Order created successfully");
    logInfo(`Fampay Order ID: ${result.data.apiOrderId}`);
    logInfo(`Internal Order ID: ${result.data.orderId}`);
    if (result.data.invoice) {
      logInfo(`Invoice Number: ${result.data.invoice.invoiceNumber}`);
      logInfo(`Invoice Total: ${result.data.invoice.total} ${result.data.invoice.currency}`);
    }
    return { success: true, orderId: result.data.apiOrderId };
  } else {
    logError("Failed to create order");
    console.log(result.error);
    return { success: false };
  }
  */
  
  log("\n⏭️  Order creation skipped (uncomment code to enable)", "yellow");
  return { success: true, orderId: null, skipped: true };
}

async function test6_CheckOrderStatus(orderId) {
  if (!orderId) {
    logStep(6, "Check Order Status (SKIPPED - No Order ID)");
    log("⏭️  Skipping because no order was created", "yellow");
    return true;
  }

  logStep(6, `Check Order Status (Order ID: ${orderId})`);
  
  const result = await apiRequest("GET", `/api-integrations/orders/${orderId}/status`);

  if (result.success) {
    logSuccess("Order status retrieved successfully");
    logInfo(`Status: ${result.data.data?.status || "N/A"}`);
    logInfo(`Start Count: ${result.data.data?.start_count || "N/A"}`);
    logInfo(`Remains: ${result.data.data?.remains || "N/A"}`);
    logInfo(`Charge: ${result.data.data?.charge || "N/A"}`);
    
    if (result.data.order) {
      logInfo(`Internal Order Status: ${result.data.order.status}`);
    }
    return true;
  } else {
    logError("Failed to get order status");
    console.log(result.error);
    return false;
  }
}

async function test7_GetOrders() {
  logStep(7, "Get All Orders");
  
  const result = await apiRequest("GET", "/orders");

  if (result.success) {
    const orders = result.data.data || [];
    logSuccess(`Found ${orders.length} order(s)`);
    
    if (orders.length > 0) {
      log("\nRecent Orders:", "yellow");
      orders.slice(0, 3).forEach((order, index) => {
        log(`\n  Order ${index + 1}:`, "yellow");
        log(`    ID: ${order._id}`, "yellow");
        log(`    Service: ${order.serviceName}`, "yellow");
        log(`    Quantity: ${order.quantity}`, "yellow");
        log(`    Status: ${order.status}`, "yellow");
        log(`    Cost: ${order.cost}`, "yellow");
        if (order.invoiceId) {
          log(`    Invoice: ${order.invoiceId.invoiceNumber || order.invoiceId}`, "yellow");
        }
      });
    }
    return true;
  } else {
    logError("Failed to get orders");
    console.log(result.error);
    return false;
  }
}

async function test8_GetAnalytics() {
  logStep(8, "Get Analytics Dashboard");
  
  const result = await apiRequest("GET", `/analytics/dashboard?companyId=${companyId}`);

  if (result.success) {
    logSuccess("Analytics retrieved successfully");
    const analytics = result.data.data;
    
    log("\nAnalytics Summary:", "yellow");
    log(`  Total Orders: ${analytics.totalOrders || 0}`, "yellow");
    log(`  Total Spent: ${analytics.totalSpent || 0}`, "yellow");
    log(`  Total Invoices: ${analytics.totalInvoices || 0}`, "yellow");
    log(`  Pending Invoices: ${analytics.pendingInvoices || 0}`, "yellow");
    
    return true;
  } else {
    logError("Failed to get analytics");
    console.log(result.error);
    return false;
  }
}

// Main test runner
async function runTests() {
  log("\n╔════════════════════════════════════════════════════════════╗", "cyan");
  log("║        SOCIAL SCALE BACKEND - FAMPAY INTEGRATION TEST      ║", "cyan");
  log("╚════════════════════════════════════════════════════════════╝", "cyan");

  const results = [];
  let createdOrderId = null;

  // Run tests sequentially
  results.push(await test1_Login());
  if (!results[0]) {
    logError("Login failed. Cannot continue tests.");
    process.exit(1);
  }

  results.push(await test2_GetCompanies());
  if (!results[1]) {
    logError("Failed to get companies. Cannot continue tests.");
    process.exit(1);
  }

  results.push(await test3_CheckFampayBalance());
  results.push(await test4_GetFampayServices());
  
  const orderResult = await test5_CreateOrder();
  results.push(orderResult.success);
  createdOrderId = orderResult.orderId;

  results.push(await test6_CheckOrderStatus(createdOrderId));
  results.push(await test7_GetOrders());
  results.push(await test8_GetAnalytics());

  // Summary
  logStep("SUMMARY", "Test Results");
  const passed = results.filter(r => r === true).length;
  const total = results.length;

  log(`\nTests Passed: ${passed}/${total}`, passed === total ? "green" : "red");
  
  if (passed === total) {
    logSuccess("All tests passed! 🎉");
  } else {
    logError("Some tests failed. Please review the output above.");
  }

  log("\n" + "=".repeat(60), "cyan");
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  logError("Test runner failed");
  console.error(error);
  process.exit(1);
});
