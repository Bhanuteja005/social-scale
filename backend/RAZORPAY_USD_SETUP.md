# Razorpay Setup Guide - USD Support

## For Testing (Current Setup)
Your current test keys work with INR only:
- Key ID: `rzp_test_S0YsSSmMBuT5yg`
- Key Secret: `eSXmevcuu7PFmCvnqqiU4Sy6`

**Note:** Razorpay test mode in India only supports INR currency.

## For Production with USD Support

### Step 1: Complete KYC Verification
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **Profile** → **Business Details**
3. Complete all KYC requirements:
   - Business registration documents
   - PAN card
   - Bank account details
   - GSTIN (if applicable)

### Step 2: Enable International Payments
1. Navigate to **Settings** → **Payment Methods**
2. Click on **International Payments**
3. Select **Enable International Payments**
4. Choose supported currencies (USD, EUR, GBP, etc.)
5. Submit for approval (typically takes 2-3 business days)

### Step 3: Get Production API Keys
1. After KYC approval, go to **Settings** → **API Keys**
2. Click **Generate Key** under Production
3. Copy your production credentials:
   - **Key ID**: `rzp_live_XXXXXXXXXX`
   - **Key Secret**: `XXXXXXXXXXXXXXXXXX`
4. **Important:** Save the Key Secret immediately - it won't be shown again

### Step 4: Configure Backend
Update `backend/.env`:
```env
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXX
```

### Step 5: Configure Frontend
Update `socialscaleagency/.env`:
```env
VITE_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
```

### Step 6: Set Currency in Code
The currency is already set to USD in the code. When creating Razorpay orders, ensure:
```javascript
{
  amount: price * 100, // Amount in cents (USD)
  currency: "USD"
}
```

## Important Notes

### Test Mode Limitations
- Test mode **only supports INR** in India
- To test USD, you need to:
  1. Complete KYC and enable international payments
  2. Use live mode with small amounts (minimum $0.50)
  3. Or use Razorpay's international test account (requires separate application)

### Currency Conversion
- If user pays in USD, Razorpay handles conversion
- Settlement to your bank account will be in INR (based on current exchange rate)
- Razorpay charges additional fees for international transactions:
  - Domestic: 2% + GST
  - International: 3% + GST

### Production Checklist
- [ ] KYC completed and verified
- [ ] International payments enabled
- [ ] Production API keys generated
- [ ] Environment variables updated
- [ ] Test small transaction first
- [ ] Set up webhooks for payment notifications
- [ ] Configure proper error handling

## Alternative: Keep INR for Now
If you want to launch quickly without waiting for international approval:

1. **Keep INR as currency**
2. **Convert pricing:** $29 → ₹2400, $99 → ₹8200
3. Update pricing:
```javascript
growth: { credits: 2500, price: 2400, currency: "INR" }
enterprise: { credits: 10000, price: 8200, currency: "INR" }
```

This way you can go live immediately with the test keys and add USD support later.

## Resources
- [Razorpay International Payments Guide](https://razorpay.com/docs/payments/international-payments/)
- [Razorpay Dashboard](https://dashboard.razorpay.com/)
- [API Keys Documentation](https://razorpay.com/docs/payments/dashboard/settings/api-keys/)
