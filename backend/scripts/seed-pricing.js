require("dotenv").config();
const mongoose = require("mongoose");
const PricingRule = require("../src/models/PricingRule");
const logger = require("../src/config/logger");

const defaultPricingRules = [
  {
    name: "Global Default Pricing",
    description: "Default pricing for all users and companies",
    scope: "global",
    priority: 0,
    isActive: true,
    servicePricing: [
      // Instagram
      { platform: "instagram", serviceType: "follower", creditsPerUnit: 5, minQuantity: 10, maxQuantity: 100000 },
      { platform: "instagram", serviceType: "like", creditsPerUnit: 0.2, minQuantity: 10, maxQuantity: 100000 },
      { platform: "instagram", serviceType: "comment", creditsPerUnit: 10, minQuantity: 5, maxQuantity: 10000 },
      { platform: "instagram", serviceType: "view", creditsPerUnit: 0.1, minQuantity: 100, maxQuantity: 1000000 },
      
      // Facebook
      { platform: "facebook", serviceType: "follower", creditsPerUnit: 5, minQuantity: 10, maxQuantity: 100000 },
      { platform: "facebook", serviceType: "like", creditsPerUnit: 0.2, minQuantity: 10, maxQuantity: 100000 },
      
      // Twitter
      { platform: "twitter", serviceType: "follower", creditsPerUnit: 5, minQuantity: 10, maxQuantity: 100000 },
      { platform: "twitter", serviceType: "like", creditsPerUnit: 0.2, minQuantity: 10, maxQuantity: 100000 },
      { platform: "twitter", serviceType: "retweet", creditsPerUnit: 2, minQuantity: 10, maxQuantity: 50000 },
      
      // LinkedIn
      { platform: "linkedin", serviceType: "follower", creditsPerUnit: 20, minQuantity: 10, maxQuantity: 50000 },
      { platform: "linkedin", serviceType: "like", creditsPerUnit: 10, minQuantity: 5, maxQuantity: 10000 },
      
      // YouTube
      { platform: "youtube", serviceType: "subscribe", creditsPerUnit: 10, minQuantity: 10, maxQuantity: 100000 },
      { platform: "youtube", serviceType: "view", creditsPerUnit: 0.05, minQuantity: 100, maxQuantity: 1000000 },
      { platform: "youtube", serviceType: "like", creditsPerUnit: 1, minQuantity: 10, maxQuantity: 50000 },
      
      // TikTok
      { platform: "tiktok", serviceType: "follower", creditsPerUnit: 5, minQuantity: 10, maxQuantity: 100000 },
      { platform: "tiktok", serviceType: "like", creditsPerUnit: 0.2, minQuantity: 10, maxQuantity: 100000 },
      { platform: "tiktok", serviceType: "view", creditsPerUnit: 0.1, minQuantity: 100, maxQuantity: 1000000 },
    ],
    subscriptionPlans: [
      {
        plan: "growth",
        credits: 2500,
        price: 29,
        currency: "USD",
        billingCycle: "monthly",
      },
      {
        plan: "enterprise",
        credits: 10000,
        price: 99,
        currency: "USD",
        billingCycle: "monthly",
      },
    ],
  },
];

const seedPricing = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info("Connected to MongoDB");

    // Clear existing global pricing rules
    await PricingRule.deleteMany({ scope: "global" });
    logger.info("Cleared existing global pricing rules");

    // Insert default pricing rules
    await PricingRule.insertMany(defaultPricingRules);
    logger.info("Default pricing rules created successfully");

    logger.info("Pricing seed completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Error seeding pricing:", error);
    process.exit(1);
  }
};

seedPricing();
