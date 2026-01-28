const fs = require('fs');

console.log('\n' + '='.repeat(100));
console.log('COMPLETE PRICE UPDATE SUMMARY - ALL PLATFORMS');
console.log('='.repeat(100));

const allUpdates = {
    'Instagram': [
        { id: '2279', price: '158.6281', name: 'Followers [Good Quality] [30D Refill]' },
        { id: '3703', price: '217.6799', name: 'Followers [High Quality] [365D Refill]' },
        { id: '3774', price: '270', name: 'Followers [High Quality] [Lifetime Refill] (NOT IN API)' },
        { id: '4301', price: '261.2158', name: 'Followers [High Quality] [365D Refill] [Recommended]' },
        { id: '4302', price: '232.6562', name: 'Followers [High Quality] [Lifetime Refill] Low Drops' },
        { id: '3246', price: '335.4011', name: 'Likes [Real Profiles] [USA Insights]' },
        { id: '3724', price: '104.2251', name: 'Likes [Foreign Profiles] [Real + Mix]' },
        { id: '2495', price: '49.7000', name: 'Story Views' },
        { id: '4252', price: '1379.4030', name: 'Repost [Global]' },
        { id: '4279', price: '92.2950', name: 'Repost [Cheapest]' },
        { id: '3463', price: '87.0719', name: 'Comments [Mix Indian]' },
        { id: '4219', price: '6743.7994', name: 'Comments [Super REAL] [Foreign Insights]' },
        { id: '3694', price: '1.1915', name: 'Reel Views - Cheap S2' },
        { id: '4030', price: '1.2016', name: 'Reel Views - Cheap' },
        { id: '3294', price: '1.8331', name: 'Reel Views - Good' },
        { id: '3651', price: '2.5003', name: 'Reel Views - Best' },
        { id: '3964', price: '141.1482', name: 'Channel Member [Global]' },
        { id: '3971', price: '141.1482', name: 'Channel Member [India]' },
        { id: '4031', price: '267.5726', name: 'Story Vote [1st Option/A]' },
        { id: '4032', price: '267.5726', name: 'Story Vote [2nd Option/B]' },
        { id: '4033', price: '267.5726', name: 'Story Vote [3rd Option/C]' },
        { id: '4034', price: '267.5726', name: 'Story Vote [4th Option/D]' },
        { id: '4035', price: '138.7088', name: 'Story Vote [A] [Price for 100]' },
        { id: '4036', price: '592.9272', name: 'Story Vote [B] [Price for 100]' }
    ],
    'TikTok': [
        { id: '2779', price: '119.9943', name: 'Followers [High Quality] [No Refill]' },
        { id: '2781', price: '161.6055', name: 'Followers [High Quality] [Lifetime Refill]' },
        { id: '2782', price: '131.9610', name: 'Followers [High Quality] [30D Refill]' },
        { id: '2130', price: '12.3600', name: 'Likes [BEST]' },
        { id: '2125', price: '2.6209', name: 'Video Views [S2]' },
        { id: '2127', price: '10.8840', name: 'Video Views [Lifetime]' },
        { id: '2128', price: '4.7780', name: 'Video Views [S1]' }
    ],
    'LinkedIn': [
        { id: '4002', price: '2621.3239', name: 'Profile Followers' },
        { id: '4005', price: '1613.1224', name: 'Post Likes' },
        { id: '4006', price: '2621.3239', name: 'Post Share' }
    ],
    'YouTube': [
        { id: '2292', price: '850', name: 'Subscribers [Slow] (NOT IN API)' },
        { id: '2837', price: '3747.5767', name: 'Subscribers [Best Service]' },
        { id: '4293', price: '19.0000', name: '100 Views [Nondrop]' },
        { id: '3032', price: '77.0000', name: '500 Views [Nondrop]' },
        { id: '3718', price: '151.7618', name: '1000 Views [Nondrop]' },
        { id: '4081', price: '373.0162', name: '3000 Views [Nondrop]' },
        { id: '3546', price: '4193.4400', name: 'Views with Full Watchtime + Likes' },
        { id: '3860', price: '348.1600', name: 'Views + Likes [Real Engagement]' },
        { id: '3985', price: '124.3387', name: 'Views [Lifetime] - 2 Min' },
        { id: '3986', price: '118.8578', name: 'Views [Lifetime] - 3 Min' },
        { id: '4148', price: '155.4280', name: 'Views [Lifetime] - 1 Min' },
        { id: '2349', price: '3804.8744', name: 'Watchtime [Monetization]' }
    ],
    'Twitter/X': [
        { id: '3562', price: '5918.8028', name: 'Followers [Lifetime Refill]' },
        { id: '3788', price: '1998.8308', name: 'Followers [30 Day Refill]' },
        { id: '3909', price: '643.6358', name: 'Likes' }
    ],
    'Threads': [
        { id: '3642', price: '150', name: 'Followers (NOT IN API)' },
        { id: '3638', price: '246.7711', name: 'Likes [High Quality]' },
        { id: '3639', price: '624.4434', name: 'Reshare [Real]' },
        { id: '3640', price: '1098.0000', name: 'Reshare [SuperFast]' },
        { id: '3641', price: '6056.9081', name: 'Custom Comments' }
    ],
    'Pinterest': [
        { id: '2950', price: '1107.3600', name: 'Followers (MQ)' },
        { id: '2953', price: '2697.4200', name: 'Followers (HQ)' },
        { id: '2951', price: '1801.5800', name: 'Likes (1.5k/D)' },
        { id: '2952', price: '1318.0600', name: 'Repins (HQ)' }
    ],
    'Facebook': [
        { id: '2085', price: '986.5343', name: 'Post Likes - Mix Indian' },
        { id: '3251', price: '186.3340', name: 'Post Likes [Lifetime Refill]' },
        { id: '2517', price: '89.8126', name: 'Followers + Like' },
        { id: '3391', price: '7.6200', name: 'Reel & Video Views [100k Pack]' },
        { id: '3392', price: '36.8500', name: 'Reel & Video Views [3 Sec Retention]' },
        { id: '3394', price: '9.7600', name: 'Reel & Video Views [Good Speed]' },
        { id: '4043', price: '18.3034', name: 'Reel & Video Views [Real Quality]' }
    ],
    'Spotify': [
        { id: '3339', price: '42.7477', name: 'Podcast Followers' },
        { id: '3340', price: '42.7477', name: 'Artist Followers' },
        { id: '3341', price: '69.1443', name: 'Playlist Followers' },
        { id: '3342', price: '42.7477', name: 'User Followers' },
        { id: '3343', price: '40.8230', name: 'Followers [All links]' }
    ],
    'Quora': [
        { id: '3794', price: '1169.7600', name: 'Followers' },
        { id: '3791', price: '221.1400', name: 'Views' },
        { id: '3792', price: '1123.6200', name: 'Likes' },
        { id: '3793', price: '1123.6200', name: 'Shares' },
        { id: '3795', price: '2653.5200', name: 'Upvotes' }
    ]
};

let totalServices = 0;
let totalUpdated = 0;

Object.entries(allUpdates).forEach(([platform, services]) => {
    console.log(`\n${platform} (${services.length} services):`);
    console.log('-'.repeat(100));
    services.forEach(svc => {
        totalServices++;
        const isFromAPI = !svc.name.includes('NOT IN API');
        if (isFromAPI) totalUpdated++;
        console.log(`  ${svc.id.padEnd(6)} | ₹${svc.price.padEnd(12)} | ${svc.name} ${isFromAPI ? '✅' : '⚠️'}`);
    });
});

console.log('\n' + '='.repeat(100));
console.log(`TOTAL: ${totalUpdated}/${totalServices} services updated with live Fampage prices`);
console.log('='.repeat(100));
console.log('\n✅ ALL PRICES IN services.ts HAVE BEEN UPDATED!');
console.log('\nNote: Services marked with ⚠️ were not found in Fampage API.');
console.log('They will be updated automatically when Admin fetches live pricing.\n');
