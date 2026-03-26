const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const config = require(path.join(__dirname, '..', 'src', 'config', 'env'));

const servicesPath = path.join(__dirname, '..', '..', 'socialscaleagency', 'src', 'data', 'services.ts');
const text = fs.readFileSync(servicesPath, 'utf8');
const idRegex = /id:\s*"(\d+)"/g;
const appIds = [];
let m;
while ((m = idRegex.exec(text)) !== null) appIds.push(m[1]);

const oldMissing = [
  '4301','3741','3294','3651','4031','4032','4033','4034','4037','4038','2779','2781','2782','2292','2349','3562','3788','3642','3638','3639','3640','3641'
];

(async () => {
  const url = `${config.fampage.baseUrl}?action=services&key=${config.fampage.apiKey}`;
  const resp = await axios.get(url);
  const api = Array.isArray(resp.data) ? resp.data : [];
  const apiIds = new Set(api.map(s => String(s.service)));

  const stillMissing = oldMissing.filter(id => !appIds.includes(id));
  const perPlatform = {
    instagram: 0,
    tiktok: 0,
    linkedin: 0,
    youtube: 0,
    twitter: 0,
    threads: 0,
    pinterest: 0,
    discord: 0,
    facebook: 0,
    spotify: 0,
    telegram: 0,
    quora: 0,
    other: 0,
  };

  for (const s of api) {
    const name = `${String(s.name || '').toLowerCase()} ${String(s.category || '').toLowerCase()}`;
    if (name.includes('instagram')) perPlatform.instagram++;
    else if (name.includes('tiktok') || name.includes('tik tok')) perPlatform.tiktok++;
    else if (name.includes('linkedin')) perPlatform.linkedin++;
    else if (name.includes('youtube') || name.includes('yt ')) perPlatform.youtube++;
    else if (name.includes('twitter') || name.includes('x/twitter') || name.includes(' x ')) perPlatform.twitter++;
    else if (name.includes('threads')) perPlatform.threads++;
    else if (name.includes('pinterest')) perPlatform.pinterest++;
    else if (name.includes('discord')) perPlatform.discord++;
    else if (name.includes('facebook') || name.includes('fb ')) perPlatform.facebook++;
    else if (name.includes('spotify')) perPlatform.spotify++;
    else if (name.includes('telegram')) perPlatform.telegram++;
    else if (name.includes('quora')) perPlatform.quora++;
    else perPlatform.other++;
  }

  console.log('APP IDS:', appIds.length);
  console.log('API IDS:', apiIds.size);
  console.log('OLD MISSING IDS REMOVED FROM FILE:', stillMissing.length, '/', oldMissing.length);
  console.log(stillMissing.join(', '));
  console.log('PER PLATFORM API COUNTS:', JSON.stringify(perPlatform, null, 2));

  const sample = api.find(s => String(s.service) === '2279');
  if (sample) {
    const expected = (Number(sample.rate) * 2).toFixed(4).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    const line = text.split('\n').find(l => l.includes('id: "2279"')) || '';
    console.log('SAMPLE 2279 expected doubled price:', expected);
    console.log('SAMPLE 2279 line in file:', line.trim());
  }
})();
