const fs = require('fs');
const path = require('path');
const axios = require('axios');

const servicesPath = path.join(__dirname, '..', '..', 'socialscaleagency', 'src', 'data', 'services.ts');
const servicesText = fs.readFileSync(servicesPath, 'utf8');
const idRegex = /id:\s*"(\d+)"/g;
const idsInApp = new Set();
let m;
while ((m = idRegex.exec(servicesText)) !== null) {
  idsInApp.add(m[1]);
}

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const config = require(path.join(__dirname, '..', 'src', 'config', 'env'));
const url = `${config.fampage.baseUrl}?action=services&key=${config.fampage.apiKey}`;

(async () => {
  const response = await axios.get(url);
  const apiServices = Array.isArray(response.data) ? response.data : [];
  const idsFromApi = new Set(apiServices.map(s => String(s.service)));

  const missing = [...idsInApp].filter(id => !idsFromApi.has(id));
  const unused = [...idsFromApi].filter(id => !idsInApp.has(id));

  console.log('TOTAL IDs used in app:', idsInApp.size);
  console.log('TOTAL IDs returned by API:', idsFromApi.size);
  console.log('MISSING IDs (in app but not returned by API):', missing.length);
  if (missing.length) console.log(missing.join(', '));
  console.log('UNUSED IDs (returned by API but not in app):', unused.length);
  if (unused.length) console.log(unused.slice(0, 50).join(', ') + (unused.length > 50 ? ' ...' : ''));
})();
