const axios = require('axios');
const fs = require('fs');
const path = require('path');

const FAMPAGE_API_KEY = '3rK4FkHODg9OB8Ol3UPhJhJBJ5VKEkAnaB75ALWMQ597pZGuxS0omAMthv6N';
const FAMPAGE_BASE_URL = 'https://fampage.in/api/v2';

async function fetchFampagePrices() {
    try {
        console.log('Fetching all services from Fampage API...');
        const url = `${FAMPAGE_BASE_URL}?action=services&key=${FAMPAGE_API_KEY}`;
        const response = await axios.get(url);
        
        const services = response.data;
        console.log(`\nTotal services fetched: ${services.length}`);
        
        // Create a map of service ID to price
        const priceMap = {};
        services.forEach(service => {
            priceMap[service.service] = {
                id: service.service,
                name: service.name,
                rate: service.rate,
                min: service.min,
                max: service.max,
                type: service.type,
                category: service.category
            };
        });
        
        // Save to JSON file
        const outputPath = path.join(__dirname, 'fampage_prices.json');
        fs.writeFileSync(outputPath, JSON.stringify(priceMap, null, 2));
        console.log(`\n✅ Prices saved to: ${outputPath}`);
        
        // Print services organized by our service IDs
        console.log('\n📋 Services organized by ID:\n');
        
        const ourServiceIds = [
            // Instagram Followers
            '2279', '3703', '3774', '4301', '4302',
            // Instagram Likes
            '3246', '3724',
            // Instagram Views
            '2495',
            // Instagram Repost
            '4252', '4279',
            // Instagram Comments
            '3463', '4219',
            // Instagram Live
            'INST-LIV-1', 'INST-LIV-2', 'INST-LIV-5',
            // Instagram Reel Views
            '3694', '4030', '3294', '3651',
            // Instagram Channel Members
            '3964', '3971',
            // Instagram Story Votes
            '4031', '4032', '4033', '4034', '4035', '4036', '4037', '4038',
            // TikTok
            '2779', '2781', '2782', '2130'
        ];
        
        console.log('Instagram Services:');
        console.log('='.repeat(80));
        ourServiceIds.forEach(id => {
            if (priceMap[id]) {
                const svc = priceMap[id];
                console.log(`ID: ${id.padEnd(6)} | Price: ₹${svc.rate.padEnd(10)} | ${svc.name}`);
            } else {
                console.log(`ID: ${id.padEnd(6)} | ⚠️  NOT FOUND IN FAMPAGE`);
            }
        });
        
        console.log('\n✅ Script completed successfully!');
        
        return priceMap;
        
    } catch (error) {
        console.error('❌ Error fetching Fampage prices:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

// Run the script
fetchFampagePrices();
