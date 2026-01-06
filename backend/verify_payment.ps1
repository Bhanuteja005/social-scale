# Check if Razorpay Payment was Completed

Write-Host "=== Checking Payment Status ===" -ForegroundColor Cyan
Write-Host ""

# Login
$loginBody = '{"email": "admin@socialscale.com", "password": "Admin@12345"}'
try {
    $loginResp = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $token = ($loginResp.Content | ConvertFrom-Json).data.accessToken
    $headers = @{Authorization = "Bearer $token"}
    Write-Host "✓ Connected to backend" -ForegroundColor Green
} catch {
    Write-Host "✗ Could not connect to backend" -ForegroundColor Red
    exit
}

# Check credits
try {
    $creditsResp = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/subscriptions/credits" -Method GET -Headers $headers -UseBasicParsing
    $credits = ($creditsResp.Content | ConvertFrom-Json).data

    Write-Host ""
    Write-Host "Credits Status:" -ForegroundColor Yellow
    Write-Host "• Balance: $($credits.balance)" -ForegroundColor White
    Write-Host "• Total Purchased: $($credits.totalPurchased)" -ForegroundColor White
    Write-Host "• Subscription Status: $($credits.subscription.status)" -ForegroundColor White

    if ($credits.balance -gt 0) {
        Write-Host ""
        Write-Host "🎉 PAYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "Credits have been added to your account!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⏳ Payment not completed yet" -ForegroundColor Yellow
        Write-Host "Complete payment in Razorpay Dashboard first" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Could not check credits: $($_.Exception.Message)" -ForegroundColor Red
}

# Check subscriptions
try {
    $subsResp = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/subscriptions" -Method GET -Headers $headers -UseBasicParsing
    $subs = ($subsResp.Content | ConvertFrom-Json).data.subscriptions

    Write-Host ""
    Write-Host "Subscriptions:" -ForegroundColor Yellow
    if ($subs -and $subs.Count -gt 0) {
        foreach ($sub in $subs) {
            $statusColor = if ($sub.status -eq "active") { "Green" } else { "Yellow" }
            Write-Host "• $($sub.plan) plan - Status: $($sub.status) - Credits: $($sub.credits)" -ForegroundColor $statusColor
        }
    } else {
        Write-Host "• No subscriptions found" -ForegroundColor Gray
    }
} catch {
    Write-Host "Could not check subscriptions" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Instructions ===" -ForegroundColor Cyan
Write-Host "1. Go to: https://dashboard.razorpay.com/app/orders" -ForegroundColor Blue
Write-Host "2. Click on order_S0ZEAJshPqqp5j" -ForegroundColor Blue
Write-Host "3. Find and click 'Capture Payment' or 'Mark as Paid'" -ForegroundColor Blue
Write-Host "4. Run this script again to verify" -ForegroundColor Blue