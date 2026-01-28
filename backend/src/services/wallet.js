const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { AppError } = require("../utils/errors");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const config = require("../config/env");
const logger = require("../config/logger");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

// Create Razorpay order for adding money
const createPaymentOrder = async (userId, amount) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Validate amount
    if (amount < 10) {
      throw new AppError("Minimum amount is ₹10", 400);
    }

    // Create Razorpay order
    const receiptId = `w${Date.now().toString().slice(-12)}`; // Max 40 chars, keep it short
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: "INR",
      receipt: receiptId,
      notes: {
        userId: userId.toString(),
        purpose: "wallet_recharge",
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    logger.info(`Razorpay order created: ${razorpayOrder.id} for user ${userId}`);

    return {
      orderId: razorpayOrder.id,
      amount: amount,
      currency: "INR",
      keyId: config.razorpay.keyId,
    };
  } catch (error) {
    logger.error("Failed to create Razorpay order:", error);
    throw new AppError(error.message || "Failed to create payment order", 500);
  }
};

// Verify and complete payment
const verifyAndCompletePayment = async (userId, paymentData) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(text)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new AppError("Payment verification failed", 400);
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== "captured") {
      throw new AppError("Payment not captured", 400);
    }

    const amount = payment.amount / 100; // Convert paise to rupees

    // Update user wallet
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const balanceBefore = user.wallet.balance;
    user.wallet.balance += amount;
    user.wallet.totalAdded += amount;
    await user.save();

    // Create transaction record
    const transaction = await Transaction.create({
      userId: user._id,
      type: "wallet_credit",
      amount: amount,
      currency: "INR",
      balanceBefore,
      balanceAfter: user.wallet.balance,
      status: "completed",
      paymentMethod: "razorpay",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      notes: `Wallet recharge via Razorpay`,
    });

    logger.info(`Payment completed: ${razorpay_payment_id}, Amount: ₹${amount}, User: ${userId}`);

    return {
      success: true,
      amount,
      newBalance: user.wallet.balance,
      transaction,
    };
  } catch (error) {
    logger.error("Payment verification failed:", error);
    throw new AppError(error.message || "Payment verification failed", 500);
  }
};

// Get wallet balance
const getWalletBalance = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return {
    balance: user.wallet.balance,
    totalAdded: user.wallet.totalAdded,
    totalSpent: user.wallet.totalSpent,
  };
};

module.exports = {
  createPaymentOrder,
  verifyAndCompletePayment,
  getWalletBalance,
};
