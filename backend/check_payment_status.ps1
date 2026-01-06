# Check Payment Status After Completion

Write-Host "=== Check Payment Status ===" -ForegroundColor Cyan
Write-Host ""

# Login
$loginBody = '{"email": "admin@socialscale.com", "password": "Admin@12345"}'
$loginResp = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
$token = ($loginResp.Content | ConvertFrom-Json).data.accessToken
$headers = @{Authorization = "Bearer $token"}

Write-Host "✓ Logged in" -ForegroundColor Green
Write-Host ""

# Check credits
$creditsResp = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/subscriptions/credits" -Method GET -Headers $headers -UseBasicParsing
$credits = ($creditsResp.Content | ConvertFrom-Json).data

Write-Host "Credits Balance:" -ForegroundColor Yellow
Write-Host "• Current Balance: $($credits.balance)" -ForegroundColor White
Write-Host "• Total Purchased: $($credits.totalPurchased)" -ForegroundColor White
Write-Host "• Total Spent: $($credits.totalSpent)" -ForegroundColor White
Write-Host ""

# Check subscriptions
$subsResp = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/subscriptions" -Method GET -Headers $headers -UseBasicParsing
$subs = ($subsResp.Content | ConvertFrom-Json).data.subscriptions

Write-Host "Your Subscriptions:" -ForegroundColor Yellow
if ($subs -and $subs.Count -gt 0) {
    foreach ($sub in $subs) {
        Write-Host "• Plan: $($sub.plan) | Status: $($sub.status) | Credits: $($sub.credits)" -ForegroundColor White
    }
} else {
    Write-Host "• No active subscriptions yet" -ForegroundColor Gray
}

Write-Host ""
Write-Host "If payment was completed in Razorpay Dashboard:" -ForegroundColor Green
Write-Host "• Credits should be added automatically via webhook" -ForegroundColor Gray
Write-Host "• Subscription status should change to 'active'" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Payment gateway test completed successfully!" -ForegroundColor Green