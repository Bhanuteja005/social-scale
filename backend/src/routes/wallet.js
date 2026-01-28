const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet");
const { authenticate } = require("../middlewares/auth");

router.post("/create-order", authenticate, walletController.createPaymentOrder);
router.post("/verify-payment", authenticate, walletController.verifyPayment);
router.get("/balance", authenticate, walletController.getBalance);

module.exports = router;
