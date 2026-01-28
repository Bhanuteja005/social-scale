const walletService = require("../services/wallet");

const createPaymentOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    const result = await walletService.createPaymentOrder(userId, amount);

    res.status(200).json({
      success: true,
      message: "Payment order created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const paymentData = req.body;

    const result = await walletService.verifyAndCompletePayment(userId, paymentData);

    res.status(200).json({
      success: true,
      message: "Payment verified and wallet updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getBalance = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const result = await walletService.getWalletBalance(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getBalance,
};
