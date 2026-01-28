const fs = require('fs');
const data = JSON.parse(fs.readFileSync('fampage_prices.json', 'utf8'));

const serviceIds = [
    // TikTok Views
    '2125', '2127', '2128',
    // LinkedIn
    '4002', '4005', '4006',
    // YouTube (check these too)
    '2140', '2139', '2141', '2142', '2143', '2145',
    // Twitter/X
    '2180', '2181', '2182', '2183',
    // Facebook
    '2200', '2201', '2202', '2203', '2204',
    // Threads
    '3800', '3801', '3802'
];

console.log('Service Prices from Fampage:\n');
serviceIds.forEach(id => {
    if (data[id]) {
        console.log(`${id.padEnd(6)}: ₹${data[id].rate.padEnd(12)} - ${data[id].name}`);
    } else {
        console.log(`${id.padEnd(6)}: NOT FOUND IN FAMPAGE`);
    }
});
