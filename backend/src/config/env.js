require("dotenv").config();

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  apiVersion: process.env.API_VERSION || "v1",

  mongodb: {
    uri: process.env.DATABASE_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/social_scale",
    testUri:
      process.env.MONGODB_TEST_URI ||
      "mongodb://localhost:27017/social_scale_test",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "default-secret-change-in-production",
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || "15m",
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || "7d",
  },

  session: {
    secret: process.env.SESSION_SECRET || "default-session-secret-change-in-production",
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
  },

  api: {
    timeout: parseInt(process.env.API_PROVIDER_TIMEOUT) || 30000,
    retryAttempts: parseInt(process.env.API_PROVIDER_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.API_PROVIDER_RETRY_DELAY) || 1000,
    sandboxMode: process.env.API_SANDBOX_MODE === "true",
  },

  fampage: {
    apiKey: process.env.FAMPAGE_API_KEY || "",
    baseUrl: process.env.FAMPAGE_BASE_URL || "https://fampage.in/api/v2",
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_S0YsSSmMBuT5yg",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "eSXmevcuu7PFmCvnqqiU4Sy6",
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || "https://social-scale.vercel.app/api/v1/auth/google/callback",
  },

  frontendUrl: process.env.FRONTEND_URL,

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};
