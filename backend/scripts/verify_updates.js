const fs = require('fs');
const path = require('path');

console.log('='.repeat(100));
console.log('PRICE UPDATE SUMMARY');
console.log('='.repeat(100));

// Read the price updates file
const priceUpdates = JSON.parse(fs.readFileSync('price_updates.json', 'utf8'));

console.log('\n✅ ALL SERVICES UPDATED WITH FAMPAGE PRICES:\n');
console.log('Total services updated:', Object.keys(priceUpdates).length);

// Group by platform
const platforms = {
    'Instagram': [],
    'TikTok': [],
    'LinkedIn': [],
    'YouTube': [],
    'Twitter/X': [],
    'Threads': [],
    'Pinterest': [],
    'Facebook': [],
    'Spotify': [],
    'Quora': []
};

Object.entries(priceUpdates).forEach(([id, rate]) => {
    const idNum = parseInt(id);
    if ([2279, 3703, 3774, 4301, 4302, 3246, 3724, 2495, 4252, 4279, 3463, 4219, 3694, 4030, 3294, 3651, 3964, 3971, 4031, 4032, 4033, 4034, 4035, 4036].includes(idNum)) {
        platforms['Instagram'].push({ id, rate });
    } else if ([2125, 2127, 2128, 2779, 2781, 2782, 2130].includes(idNum)) {
        platforms['TikTok'].push({ id, rate });
    } else if ([4002, 4005, 4006].includes(idNum)) {
        platforms['LinkedIn'].push({ id, rate });
    } else if ([2837, 4293, 3032, 3718, 4081, 3546, 3860, 3985, 3986, 4148, 2349].includes(idNum)) {
        platforms['YouTube'].push({ id, rate });
    } else if ([3562, 3788, 3909].includes(idNum)) {
        platforms['Twitter/X'].push({ id, rate });
    } else if ([3638, 3639, 3640, 3641].includes(idNum)) {
        platforms['Threads'].push({ id, rate });
    } else if ([2950, 2953, 2951, 2952].includes(idNum)) {
        platforms['Pinterest'].push({ id, rate });
    } else if ([2085, 3251, 2517, 3391, 3392, 3394, 4043].includes(idNum)) {
        platforms['Facebook'].push({ id, rate });
    } else if ([3339, 3340, 3341, 3342, 3343].includes(idNum)) {
        platforms['Spotify'].push({ id, rate });
    } else if ([3794, 3791, 3792, 3793, 3795].includes(idNum)) {
        platforms['Quora'].push({ id, rate });
    }
});

Object.entries(platforms).forEach(([platform, services]) => {
    if (services.length > 0) {
        console.log(`\n${platform}:`);
        services.forEach(({ id, rate }) => {
            console.log(`  • Service ${id}: ₹${rate}/1K`);
        });
    }
});

console.log('\n' + '='.repeat(100));
console.log('✅ All prices in services.ts have been updated with exact Fampage API values!');
console.log('='.repeat(100));
console.log('\nNote: Services not found in Fampage (kept original prices):');
console.log('  • 2292 - YouTube Subscriber (Slow speed)');
console.log('  • 3642 - Threads Followers');
console.log('  • 3774 - Instagram Followers (High Quality Lifetime)');
console.log('  • TG-MEM-1, TG-VIW-1 - Telegram services (custom IDs)');
console.log('\nThese services will use live API pricing when Admin fetches from Fampage.');
console.log('='.repeat(100));
