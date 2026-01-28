const fs = require('fs');
const data = JSON.parse(fs.readFileSync('fampage_prices.json', 'utf8'));

const allServiceIds = [
    // TikTok Views
    '2125', '2127', '2128',
    // LinkedIn
    '4002', '4005', '4006',
    // YouTube
    '2292', '2837', '4293', '3032', '3718', '4081', '3546', '3860', '3985', '3986', '4148', '2349',
    // Twitter/X
    '3562', '3788', '3909',
    // Threads
    '3642', '3638', '3639', '3640', '3641',
    // Pinterest
    '2950', '2953', '2951', '2952',
    // Facebook
    '2085', '3251', '2517', '3391', '3392', '3394', '4043',
    // Spotify
    '3339', '3340', '3341'
];

console.log('='.repeat(100));
console.log('ALL SERVICE PRICES FROM FAMPAGE');
console.log('='.repeat(100));

const foundPrices = {};
const notFound = [];

allServiceIds.forEach(id => {
    if (data[id]) {
        foundPrices[id] = data[id].rate;
        console.log(`${id.padEnd(8)}: ₹${data[id].rate.padEnd(15)} ${data[id].name}`);
    } else {
        notFound.push(id);
        console.log(`${id.padEnd(8)}: ❌ NOT FOUND`);
    }
});

console.log('\n' + '='.repeat(100));
console.log(`SUMMARY: Found ${Object.keys(foundPrices).length}/${allServiceIds.length} services`);
if (notFound.length > 0) {
    console.log(`Missing IDs: ${notFound.join(', ')}`);
}
console.log('='.repeat(100));

// Save a mapping file for easy updates
fs.writeFileSync('price_updates.json', JSON.stringify(foundPrices, null, 2));
console.log('\n✅ Price mapping saved to price_updates.json');
