const fs = require('fs');
const data = JSON.parse(fs.readFileSync('fampage_prices.json', 'utf8'));

const remainingIds = ['3342', '3343', '3794', '3791', '3792', '3793', '3795'];

console.log('Remaining Service Prices:\n');
remainingIds.forEach(id => {
    if (data[id]) {
        console.log(`${id}: ₹${data[id].rate} - ${data[id].name}`);
    } else {
        console.log(`${id}: NOT FOUND`);
    }
});
