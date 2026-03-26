const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const config = require(path.join(__dirname, '..', 'src', 'config', 'env'));

const servicesPath = path.join(__dirname, '..', '..', 'socialscaleagency', 'src', 'data', 'services.ts');
const servicesText = fs.readFileSync(servicesPath, 'utf8');

// Extract each package id + price pair from services.ts
const pairRegex = /\{\s*id:\s*"(\d+)"\s*,\s*name:\s*"(?:[^"\\]|\\.)*"\s*,\s*price:\s*"([0-9]+(?:\.[0-9]+)?)"/g;

const appMap = new Map();
let match;
while ((match = pairRegex.exec(servicesText)) !== null) {
  const id = match[1];
  const price = Number(match[2]);
  if (!appMap.has(id)) {
    appMap.set(id, price);
  }
}

function normalizeDoubled(rate) {
  const doubled = Number(rate) * 2;
  return Number(doubled.toFixed(4));
}

(async () => {
  if (!config.fampage.apiKey) {
    throw new Error('Missing FAMPAGE_API_KEY in backend/.env');
  }

  const url = `${config.fampage.baseUrl}?action=services&key=${config.fampage.apiKey}`;
  const response = await axios.get(url);
  const apiServices = Array.isArray(response.data) ? response.data : [];

  const apiMap = new Map();
  for (const s of apiServices) {
    apiMap.set(String(s.service), s);
  }

  const appIds = [...appMap.keys()];
  const apiIds = [...apiMap.keys()];

  const missingInApi = appIds.filter((id) => !apiMap.has(id));
  const missingInApp = apiIds.filter((id) => !appMap.has(id));

  const wrongPrices = [];
  for (const id of appIds) {
    if (!apiMap.has(id)) continue;
    const apiRate = Number(apiMap.get(id).rate);
    const expected = normalizeDoubled(apiRate);
    const actual = Number(appMap.get(id));

    if (Math.abs(actual - expected) > 0.0001) {
      wrongPrices.push({ id, apiRate, expected, actual });
    }
  }

  const summary = {
    appIdCount: appIds.length,
    apiIdCount: apiIds.length,
    missingInApiCount: missingInApi.length,
    missingInAppCount: missingInApp.length,
    wrongPriceCount: wrongPrices.length,
  };

  console.log('=== VERIFICATION SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));

  if (missingInApi.length) {
    console.log('\nIDs in app but missing in Fampage:');
    console.log(missingInApi.join(', '));
  }

  if (missingInApp.length) {
    console.log('\nIDs in Fampage but missing in app:');
    console.log(missingInApp.join(', '));
  }

  if (wrongPrices.length) {
    console.log('\nIDs with non-doubled prices:');
    wrongPrices.slice(0, 50).forEach((x) => {
      console.log(`ID ${x.id}: rate=${x.apiRate}, expected=${x.expected}, actual=${x.actual}`);
    });
    if (wrongPrices.length > 50) {
      console.log(`...and ${wrongPrices.length - 50} more`);
    }
  }
})();
