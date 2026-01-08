const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const passport = require("passport");
const config = require("./config/env");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");

const authRoutes = require("./routes/auth");
const companyRoutes = require("./routes/companies");
const userRoutes = require("./routes/users");
const apiIntegrationRoutes = require("./routes/apiIntegrations");
const analyticsRoutes = require("./routes/analytics");
const orderRoutes = require("./routes/orders");
const invoiceRoutes = require("./routes/invoices");
const subscriptionRoutes = require("./routes/subscriptions");
const pricingRoutes = require("./routes/pricing");
const orderSyncRoutes = require("./routes/orderSync");

const app = express();

// Initialize Passport
require("./config/passport");

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api", limiter);

const apiVersion = `/api/${config.apiVersion}`;

app.use(`${apiVersion}/auth`, authRoutes);
app.use(`${apiVersion}/companies`, companyRoutes);
app.use(`${apiVersion}/users`, userRoutes);
app.use(`${apiVersion}/api-integrations`, apiIntegrationRoutes);
app.use(`${apiVersion}/analytics`, analyticsRoutes);
app.use(`${apiVersion}/orders`, orderRoutes);
app.use(`${apiVersion}/invoices`, invoiceRoutes);
app.use(`${apiVersion}/subscriptions`, subscriptionRoutes);
app.use(`${apiVersion}/pricing`, pricingRoutes);
app.use(`${apiVersion}/order-sync`, orderSyncRoutes);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Social Scale API",
    version: "1.0.0",
    documentation: "https://social-scale.vercel.app/api/v1",
    endpoints: {
      auth: `${apiVersion}/auth`,
      companies: `${apiVersion}/companies`,
      users: `${apiVersion}/users`,
      orders: `${apiVersion}/orders`,
      analytics: `${apiVersion}/analytics`,
      invoices: `${apiVersion}/invoices`,
      "api-integrations": `${apiVersion}/api-integrations`,
    },
    health: "/health",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
