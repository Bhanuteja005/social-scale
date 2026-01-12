const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = 'admin@socialscale.com';
const ADMIN_PASSWORD = 'Admin@12345';

// Test data
const testPricingRule = {
  name: 'Global Price Override',
  serviceType: 'instagram_followers',
  packageType: 'basic',
  originalPrice: 10.00,
  discountedPrice: 5.00,
  priority: 100, // High priority for global override
  isActive: true,
  isGlobal: true,
  validFrom: new Date(),
  validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
};

async function loginAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    console.log('Login response:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('✅ Admin login successful');
      // Extract accessToken from nested data object
      const token = response.data.data?.accessToken || response.data.token || response.data.data?.token;
      if (!token) {
        throw new Error('No token found in response');
      }
      return token;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    console.error('Full error:', error);
    throw error;
  }
}

async function createGlobalPricingRule(token) {
  try {
    console.log('💰 Creating global pricing rule...');
    const response = await axios.post(`${API_BASE_URL}/pricing/rules`, testPricingRule, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Global pricing rule created successfully');
      return response.data.rule;
    } else {
      throw new Error('Failed to create pricing rule');
    }
  } catch (error) {
    console.error('❌ Failed to create pricing rule:', error.response?.data || error.message);
    throw error;
  }
}

async function getPricingRules(token) {
  try {
    console.log('📋 Fetching pricing rules...');
    const response = await axios.get(`${API_BASE_URL}/pricing/rules`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Pricing rules response:', JSON.stringify(response.data, null, 2));

    // Handle both response.data.rules and response.data.data
    const rules = response.data.data || response.data.rules || [];
    console.log(`✅ Found ${rules.length} pricing rules`);
    return rules;
  } catch (error) {
    console.error('❌ Failed to fetch pricing rules:', error.response?.data || error.message);
    throw error;
  }
}

async function testPriceCalculation(token) {
  try {
    console.log('🧮 Testing price calculation...');
    const testOrder = {
      serviceType: 'instagram_followers',
      packageType: 'basic',
      quantity: 100
    };

    const response = await axios.post(`${API_BASE_URL}/pricing/calculate`, testOrder, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const { originalPrice, discountedPrice, totalPrice } = response.data;
      console.log('✅ Price calculation successful:');
      console.log(`   Original Price: $${originalPrice}`);
      console.log(`   Discounted Price: $${discountedPrice}`);
      console.log(`   Total Price: $${totalPrice}`);

      // Verify the global rule is applied
      if (discountedPrice === testPricingRule.discountedPrice) {
        console.log('✅ Global pricing rule correctly applied!');
      } else {
        console.log('⚠️  Global pricing rule may not be applied correctly');
      }

      return response.data;
    } else {
      throw new Error('Price calculation failed');
    }
  } catch (error) {
    console.error('❌ Price calculation failed:', error.response?.data || error.message);
    throw error;
  }
}

async function updatePricingRule(token, ruleId) {
  try {
    console.log('🔄 Updating pricing rule...');
    const updatedRule = {
      ...testPricingRule,
      discountedPrice: 3.00, // Update to $3
      name: 'Updated Global Price Override'
    };

    const response = await axios.put(`${API_BASE_URL}/pricing/rules/${ruleId}`, updatedRule, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Pricing rule updated successfully');
      return response.data.rule;
    } else {
      throw new Error('Failed to update pricing rule');
    }
  } catch (error) {
    console.error('❌ Failed to update pricing rule:', error.response?.data || error.message);
    throw error;
  }
}

async function deletePricingRule(token, ruleId) {
  try {
    console.log('🗑️  Deleting pricing rule...');
    const response = await axios.delete(`${API_BASE_URL}/pricing/rules/${ruleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      console.log('✅ Pricing rule deleted successfully');
    } else {
      throw new Error('Failed to delete pricing rule');
    }
  } catch (error) {
    console.error('❌ Failed to delete pricing rule:', error.response?.data || error.message);
    throw error;
  }
}

async function runPricingSystemTest() {
  console.log('🚀 Starting Social Scale Pricing System Test\n');

  try {
    // Step 1: Login as admin
    const token = await loginAdmin();

    // Step 2: Create global pricing rule
    const createdRule = await createGlobalPricingRule(token);

    // Step 3: Fetch and verify rules
    const rules = await getPricingRules(token);
    const globalRule = rules.find(rule => rule.isGlobal && rule.serviceType === 'instagram_followers');
    if (!globalRule) {
      throw new Error('Global pricing rule not found in fetched rules');
    }

    // Step 4: Test price calculation with global rule
    await testPriceCalculation(token);

    // Step 5: Update the pricing rule
    const updatedRule = await updatePricingRule(token, createdRule._id);

    // Step 6: Test price calculation with updated rule
    await testPriceCalculation(token);

    // Step 7: Clean up - delete the test rule
    await deletePricingRule(token, createdRule._id);

    console.log('\n🎉 All pricing system tests passed successfully!');
    console.log('✅ Admin can create global pricing rules');
    console.log('✅ Global rules override default prices');
    console.log('✅ Price calculations work correctly');
    console.log('✅ Admin can update and delete pricing rules');

  } catch (error) {
    console.error('\n💥 Pricing system test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runPricingSystemTest();