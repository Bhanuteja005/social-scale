const mongoose = require('mongoose');
const Order = require('../src/models/Order');
const config = require('../src/config/env');

// Extract service info function (copied from orders service)
function extractServiceInfo(serviceName, serviceType) {
  const nameLower = (serviceName || "").toLowerCase();

  // Detect platform
  let platform = "other"; // default to other instead of instagram
  if (nameLower.includes("instagram") || nameLower.includes("ig")) platform = "instagram";
  else if (nameLower.includes("facebook") || nameLower.includes("fb")) platform = "facebook";
  else if (nameLower.includes("twitter") || nameLower.includes("x ")) platform = "twitter";
  else if (nameLower.includes("linkedin")) platform = "linkedin";
  else if (nameLower.includes("youtube") || nameLower.includes("yt")) platform = "youtube";
  else if (nameLower.includes("tiktok")) platform = "tiktok";
  else if (nameLower.includes("threads")) platform = "threads";

  return { platform };
}

async function migratePlatformField() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');

    // Find all orders that don't have platform field set
    const ordersWithoutPlatform = await Order.find({
      $or: [
        { platform: { $exists: false } },
        { platform: null },
        { platform: "" }
      ]
    });

    console.log(`Found ${ordersWithoutPlatform.length} orders without platform field`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const order of ordersWithoutPlatform) {
      try {
        const { platform } = extractServiceInfo(order.serviceName, order.serviceType);
        order.platform = platform;
        await order.save();
        updatedCount++;
        console.log(`Updated order ${order._id}: ${order.serviceName} -> ${platform}`);
      } catch (error) {
        console.error(`Error updating order ${order._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`Migration completed:`);
    console.log(`- Updated: ${updatedCount} orders`);
    console.log(`- Errors: ${errorCount} orders`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migratePlatformField();
}

module.exports = { migratePlatformField };