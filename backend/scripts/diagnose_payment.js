require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Transaction = require("../src/models/Transaction");
const Order = require("../src/models/Order");
const config = require("../src/config/env");
const Razorpay = require("razorpay");

const TARGET_EMAIL = "deekshitha@invisiedge.com";
const TARGET_RAZORPAY_ORDER_ID = "order_SNeRUFjohMuKzZ";

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

async function diagnose() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log("✅ Connected to MongoDB\n");

    // ─── 1. USER DETAILS ────────────────────────────────────────────────────
    console.log("═══════════════════════════════════════════════════");
    console.log("  USER DETAILS");
    console.log("═══════════════════════════════════════════════════");
    const user = await User.findOne({ email: TARGET_EMAIL }).select("+password");
    if (!user) {
      console.log(`❌ User NOT FOUND: ${TARGET_EMAIL}`);
      return;
    }
    console.log(`✅ User found`);
    console.log(`   ID          : ${user._id}`);
    console.log(`   Name        : ${user.name}`);
    console.log(`   Email       : ${user.email}`);
    console.log(`   Role        : ${user.role}`);
    console.log(`   Company ID  : ${user.companyId}`);
    console.log(`   Created At  : ${user.createdAt}`);
    console.log(`\n   💰 WALLET`);
    console.log(`   Balance     : ₹${user.wallet?.balance ?? 0}`);
    console.log(`   Total Added : ₹${user.wallet?.totalAdded ?? 0}`);
    console.log(`   Total Spent : ₹${user.wallet?.totalSpent ?? 0}`);
    console.log();

    // ─── 2. ALL TRANSACTIONS FOR USER ────────────────────────────────────────
    console.log("═══════════════════════════════════════════════════");
    console.log("  ALL TRANSACTIONS FOR USER");
    console.log("═══════════════════════════════════════════════════");
    const transactions = await Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
    if (transactions.length === 0) {
      console.log("❌ No transactions found for this user");
    } else {
      console.log(`Found ${transactions.length} transaction(s):\n`);
      transactions.forEach((t, i) => {
        console.log(`  [${i + 1}] ID        : ${t._id}`);
        console.log(`       Type      : ${t.type}`);
        console.log(`       Amount    : ₹${t.amount}`);
        console.log(`       Status    : ${t.status}`);
        console.log(`       Method    : ${t.paymentMethod}`);
        console.log(`       PaymentID : ${t.paymentId || "N/A"}`);
        console.log(`       OrderID   : ${t.orderId || "N/A"}`);
        console.log(`       Before    : ₹${t.balanceBefore}  →  After: ₹${t.balanceAfter}`);
        console.log(`       Notes     : ${t.notes || "N/A"}`);
        console.log(`       Created   : ${t.createdAt}`);
        console.log();
      });
    }

    // ─── 3. SEARCH TRANSACTIONS BY RAZORPAY ORDER ID ─────────────────────────
    console.log("═══════════════════════════════════════════════════");
    console.log(`  TRANSACTION LOOKUP: order ID = ${TARGET_RAZORPAY_ORDER_ID}`);
    console.log("═══════════════════════════════════════════════════");
    const txByOrderId = await Transaction.find({ orderId: TARGET_RAZORPAY_ORDER_ID }).lean();
    if (txByOrderId.length === 0) {
      console.log(`❌ No transaction found with orderId = ${TARGET_RAZORPAY_ORDER_ID}`);
      console.log("   → This means verify-payment API was NEVER called for this Razorpay order");
    } else {
      console.log(`✅ Found ${txByOrderId.length} transaction(s) for this Razorpay order:`);
      txByOrderId.forEach(t => {
        console.log(`   User: ${t.userId}  Amount: ₹${t.amount}  Status: ${t.status}`);
      });
    }
    console.log();

    // ─── 4. RAZORPAY ORDER DETAILS ────────────────────────────────────────────
    console.log("═══════════════════════════════════════════════════");
    console.log(`  RAZORPAY ORDER DETAILS`);
    console.log("═══════════════════════════════════════════════════");
    try {
      const rpOrder = await razorpay.orders.fetch(TARGET_RAZORPAY_ORDER_ID);
      console.log(`   ID          : ${rpOrder.id}`);
      console.log(`   Status      : ${rpOrder.status}`);
      console.log(`   Amount      : ₹${rpOrder.amount / 100}`);
      console.log(`   Amount Paid : ₹${rpOrder.amount_paid / 100}`);
      console.log(`   Amount Due  : ₹${rpOrder.amount_due / 100}`);
      console.log(`   Receipt     : ${rpOrder.receipt}`);
      console.log(`   Notes       : ${JSON.stringify(rpOrder.notes)}`);
      console.log(`   Created At  : ${new Date(rpOrder.created_at * 1000).toISOString()}`);

      // Fetch payments for this Razorpay order
      console.log("\n  PAYMENTS LINKED TO THIS RAZORPAY ORDER:");
      const payments = await razorpay.orders.fetchPayments(TARGET_RAZORPAY_ORDER_ID);
      if (!payments.items || payments.items.length === 0) {
        console.log("  ❌ No payments found on Razorpay for this order ID");
      } else {
        payments.items.forEach((p, i) => {
          console.log(`\n  Payment [${i + 1}]:`);
          console.log(`   Payment ID  : ${p.id}`);
          console.log(`   Status      : ${p.status}`);
          console.log(`   Amount      : ₹${p.amount / 100}`);
          console.log(`   Method      : ${p.method}`);
          console.log(`   Captured    : ${p.captured}`);
          console.log(`   Created At  : ${new Date(p.created_at * 1000).toISOString()}`);
          console.log(`   Email       : ${p.email}`);
          console.log(`   Contact     : ${p.contact}`);
        });
      }
    } catch (err) {
      console.log(`❌ Could not fetch Razorpay order: ${err.message}`);
      if (err.error) console.log(`   Razorpay error: ${JSON.stringify(err.error)}`);
    }
    console.log();

    // ─── 5. USER'S ORDERS (social media orders) ───────────────────────────────
    console.log("═══════════════════════════════════════════════════");
    console.log("  USER'S SOCIAL MEDIA ORDERS");
    console.log("═══════════════════════════════════════════════════");
    const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
    if (orders.length === 0) {
      console.log("   No social media orders found for this user");
    } else {
      console.log(`   Found ${orders.length} order(s):\n`);
      orders.forEach((o, i) => {
        console.log(`  [${i + 1}] ID       : ${o._id}`);
        console.log(`       Platform : ${o.platform}`);
        console.log(`       Service  : ${o.serviceType}`);
        console.log(`       Status   : ${o.status}`);
        console.log(`       Cost     : ₹${o.totalCost ?? o.cost ?? "N/A"}`);
        console.log(`       Created  : ${o.createdAt}`);
        console.log();
      });
    }

    // ─── 6. WALLET MATH CHECK ─────────────────────────────────────────────────
    console.log("═══════════════════════════════════════════════════");
    console.log("  WALLET RECONCILIATION");
    console.log("═══════════════════════════════════════════════════");
    const credits = transactions.filter(t => t.type === "wallet_credit" && t.status === "completed");
    const totalCredited = credits.reduce((s, t) => s + t.amount, 0);
    const debits = transactions.filter(t => ["wallet_debit", "order_payment"].includes(t.type) && t.status === "completed");
    const totalDebited = debits.reduce((s, t) => s + t.amount, 0);
    console.log(`   Transactions credited  : ₹${totalCredited} (${credits.length} credits)`);
    console.log(`   Transactions debited   : ₹${totalDebited} (${debits.length} debits)`);
    console.log(`   Expected balance       : ₹${totalCredited - totalDebited}`);
    console.log(`   Actual wallet balance  : ₹${user.wallet?.balance ?? 0}`);
    if ((totalCredited - totalDebited) !== (user.wallet?.balance ?? 0)) {
      console.log(`   ⚠️  DISCREPANCY: expected ₹${totalCredited - totalDebited} but wallet shows ₹${user.wallet?.balance ?? 0}`);
    } else {
      console.log(`   ✅ Balance matches transaction history`);
    }

    // ─── 7. CHECK LOGS FOR ANY MATCHING ERRORS ────────────────────────────────
    console.log("\n═══════════════════════════════════════════════════");
    console.log("  DIAGNOSIS SUMMARY");
    console.log("═══════════════════════════════════════════════════");
    const hasMatchingTx = txByOrderId.length > 0;
    if (!hasMatchingTx) {
      console.log(`\n🔴 ROOT CAUSE: The verify-payment API was NOT called for Razorpay order ${TARGET_RAZORPAY_ORDER_ID}`);
      console.log(`   → Money was collected by Razorpay but no /wallet/verify-payment request reached the backend`);
      console.log(`   → Either: (a) Frontend failed to call verify-payment after payment, OR`);
      console.log(`              (b) verify-payment was called but failed (network error, timeout, token expiry)`);
      console.log(`\n   ✅ FIX: Manually add ₹4500 to the user's wallet using the addFunds function`);
    } else {
      const matchingTx = txByOrderId[0];
      console.log(`\n✅ verify-payment WAS called. Transaction status: ${matchingTx.status}`);
      if (matchingTx.status !== "completed") {
        console.log(`🔴 Transaction is NOT completed. Status is: ${matchingTx.status}`);
      }
    }

  } catch (error) {
    console.error("Script error:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

diagnose();
