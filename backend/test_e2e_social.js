const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';
let authToken = '';

// Helper to log responses
const logResponse = (title, data) => {
    console.log('\n' + '='.repeat(60));
    console.log(title);
    console.log('='.repeat(60));
    console.log(JSON.stringify(data, null, 2));
};

// Helper to log errors
const logError = (title, error) => {
    console.error('\n' + '='.repeat(60));
    console.error(title);
    console.error('='.repeat(60));
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
    } else {
        console.error(error.message);
    }
};

async function testFullFlow() {
    try {
        // Step 1: Login
        console.log('\n🔐 Step 1: Logging in...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@socialscale.com',
            password: 'Admin@12345'
        });
        authToken = loginResponse.data.data.accessToken;
        logResponse('✅ Login successful', {
            token: authToken.substring(0, 20) + '...',
            user: loginResponse.data.data.user.email
        });

        // Step 2: Get all companies
        console.log('\n📋 Step 2: Getting all companies...');
        const companiesResponse = await axios.get(`${API_BASE_URL}/companies`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        logResponse('✅ Companies retrieved', {
            count: companiesResponse.data.data.length,
            companies: companiesResponse.data.data.map(c => ({
                companyId: c.companyId,
                name: c.name
            }))
        });

        // Use the first company
        const testCompany = companiesResponse.data.data[0];
        const companyId = testCompany.companyId;
        console.log(`\n🏢 Using company: ${testCompany.name} (${companyId})`);

        // Step 3: Get social accounts for this company
        console.log('\n📱 Step 3: Getting social accounts for company...');
        const socialAccountsResponse = await axios.get(
            `${API_BASE_URL}/social-accounts/company/${companyId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        logResponse('✅ Social accounts retrieved', {
            count: socialAccountsResponse.data.data?.length || 0,
            accounts: socialAccountsResponse.data.data
        });

        // Step 4: Add a new social account
        console.log('\n➕ Step 4: Adding new social account...');
        const timestamp = Date.now();
        const newAccountData = {
            companyId: companyId,
            platform: 'Instagram',
            accountName: `testuser${timestamp}`,
            accountUrl: `https://instagram.com/testuser${timestamp}`,
            username: `testuser${timestamp}`,
            accountType: 'profile',
            notes: 'Test account created by E2E test'
        };
        
        console.log('Sending data:', newAccountData);
        
        try {
            const createResponse = await axios.post(
                `${API_BASE_URL}/social-accounts`,
                newAccountData,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            logResponse('✅ Social account created', createResponse.data);

            // Step 5: Verify it was saved by fetching again
            console.log('\n🔍 Step 5: Verifying social account was saved...');
            const verifyResponse = await axios.get(
                `${API_BASE_URL}/social-accounts/company/${companyId}`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            logResponse('✅ Verification - Social accounts after creation', {
                count: verifyResponse.data.data?.length || 0,
                accounts: verifyResponse.data.data
            });

            // Step 6: Get the specific company to see if frontend would get the data
            console.log('\n🏢 Step 6: Getting company details (frontend perspective)...');
            const companyResponse = await axios.get(
                `${API_BASE_URL}/companies/${companyId}`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            logResponse('✅ Company details', companyResponse.data);

            console.log('\n✅✅✅ ALL TESTS PASSED! ✅✅✅');
            console.log('\nSummary:');
            console.log(`- Company ID: ${companyId}`);
            console.log(`- Social accounts count: ${verifyResponse.data.data?.length || 0}`);
            console.log(`- Latest account: ${newAccountData.accountName}`);

        } catch (createError) {
            logError('❌ Failed to create social account', createError);
            
            // If it failed due to duplicate, let's try to list existing ones
            console.log('\n📋 Listing existing social accounts to check for duplicates...');
            const existingResponse = await axios.get(
                `${API_BASE_URL}/social-accounts/company/${companyId}`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            logResponse('Existing social accounts', existingResponse.data);
        }

    } catch (error) {
        logError('❌ Test failed', error);
        process.exit(1);
    }
}

// Run the test
console.log('🚀 Starting End-to-End Social Account Test...');
testFullFlow();
