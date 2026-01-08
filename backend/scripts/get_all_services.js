require("dotenv").config();
const axios = require("axios");
const config = require("../src/config/env");

async function getAllServices() {
  try {
    const url = `${config.fampage.baseUrl}?action=services&key=${config.fampage.apiKey}`;
    const response = await axios.get(url);

    if (response.data && Array.isArray(response.data)) {
      // Group by platform
      const platforms = {};

      response.data.forEach(service => {
        const nameLower = service.name.toLowerCase();
        let platform = 'other';

        if (nameLower.includes('instagram')) platform = 'instagram';
        else if (nameLower.includes('tiktok')) platform = 'tiktok';
        else if (nameLower.includes('youtube') || nameLower.includes('yt ')) platform = 'youtube';
        else if (nameLower.includes('facebook') || nameLower.includes('fb ')) platform = 'facebook';
        else if (nameLower.includes('twitter') || nameLower.includes('x ')) platform = 'twitter';
        else if (nameLower.includes('linkedin')) platform = 'linkedin';

        if (!platforms[platform]) platforms[platform] = [];
        platforms[platform].push(service);
      });

      // Display services by platform
      Object.keys(platforms).forEach(platform => {
        console.log(`\n=== ${platform.toUpperCase()} ===`);
        platforms[platform].slice(0, 10).forEach(service => { // Show first 10 per platform
          console.log(`ID: ${service.service}, Name: ${service.name.substring(0, 60)}..., Rate: ${service.rate}`);
        });
        console.log(`Total ${platform} services: ${platforms[platform].length}`);
      });

      return platforms;
    }
  } catch (error) {
    console.error("Error fetching services:", error.message);
  }
}

getAllServices();