Write-Host "=== Razorpay Payment Verification ===" -ForegroundColor Cyan
Write-Host ""

# Login and check status
$loginBody = '{"email": "admin@socialscale.com", "password": "Admin@12345"}'
$loginResp = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
$token = ($loginResp.Content | ConvertFrom-Json).data.accessToken
$headers = @{Authorization = "Bearer $token"}

Write-Host "Checking current status..." -ForegroundColor Yellow
Write-Host ""

# Check credits
$creditsResp = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/subscriptions/credits" -Method GET -Headers $headers -UseBasicParsing
$credits = ($creditsResp.Content | ConvertFrom-Json).data

Write-Host "Current Credits:" -ForegroundColor Green
Write-Host "Balance: $($credits.balance)" -ForegroundColor White
Write-Host "Total Purchased: $($credits.totalPurchased)" -ForegroundColor White
Write-Host ""

if ($credits.balance -gt 0) {
    Write-Host "✅ PAYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "Credits added to account!" -ForegroundColor Green
} else {
    Write-Host "⏳ Payment not completed yet" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To complete payment:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://dashboard.razorpay.com/app/orders" -ForegroundColor White
    Write-Host "2. Click on your order (order_S0ZEAJshPqqp5j)" -ForegroundColor White
    Write-Host "3. Look for 'Capture Payment' button" -ForegroundColor White
    Write-Host "4. Click it to complete the ₹1 payment" -ForegroundColor White
}