const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = 'admin@socialscale.com';
const ADMIN_PASSWORD = 'Admin@12345';

async function testDeleteUser() {
  console.log('🧪 Testing Delete User Functionality\n');

  try {
    // Step 1: Login as Admin
    console.log('Step 1: Logging in as admin...');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    const token = loginRes.data.data.accessToken;
    console.log('✅ Login successful\n');

    // Step 2: Get all users to find a test user
    console.log('Step 2: Fetching users...');
    const usersRes = await axios.get(`${API_BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { page: 1, limit: 10 }
    });

    const users = usersRes.data.data || [];
    console.log(`✅ Found ${users.length} users`);

    // Find a non-admin user to delete
    const testUser = users.find(u => u.email !== ADMIN_EMAIL && u.role !== 'SUPER_ADMIN');
    if (!testUser) {
      console.log('❌ No suitable test user found (all users are admins)');
      return;
    }

    console.log(`📋 Test user: ${testUser.email} (${testUser._id})\n`);

    // Step 3: Try to delete the user
    console.log('Step 3: Attempting to delete user...');
    try {
      const deleteRes = await axios.delete(`${API_BASE_URL}/users/${testUser._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('✅ Delete request successful');
      console.log('Response:', deleteRes.data);

      // Step 4: Verify user was deleted
      console.log('\nStep 4: Verifying user was deleted...');
      try {
        await axios.get(`${API_BASE_URL}/users/${testUser._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('❌ User still exists (delete failed)');
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('✅ User successfully deleted (404 Not Found)');
        } else {
          console.log('❓ Unexpected response when checking deleted user:', error.response?.status);
        }
      }

    } catch (error) {
      console.log('❌ Delete request failed');
      console.log('Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.response?.data || error.message);
  }
}

testDeleteUser();