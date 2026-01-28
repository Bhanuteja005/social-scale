# Test Order Creation Script
# This tests the complete order creation flow

Write-Host "=== Testing Order Creation ===" -ForegroundColor Cyan
Write-Host ""

# Get your auth token first (replace with your actual token)
$token = Read-Host "Enter your auth token (or press Enter to use test token)"
if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Please login to get your token from browser DevTools -> Application -> LocalStorage -> accessToken" -ForegroundColor Yellow
    exit
}

# Test order data
$orderData = @{
    service = "3532"  # Instagram Reel Views service ID
    link = "https://www.instagram.com/reel/DKHg-jNPK7B/"
    quantity = 100
} | ConvertTo-Json

Write-Host "Order Data:" -ForegroundColor Green
Write-Host $orderData
Write-Host ""

# Make the API call
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    Write-Host "Creating order..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/orders" `
        -Method POST `
        -Headers $headers `
        -Body $orderData `
        -ContentType "application/json"
    
    Write-Host ""
    Write-Host "=== ORDER CREATED SUCCESSFULLY ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Order ID: $($response.data.order._id)" -ForegroundColor Cyan
    Write-Host "Service: $($response.data.order.serviceName)" -ForegroundColor Cyan
    Write-Host "Quantity: $($response.data.order.quantity)" -ForegroundColor Cyan
    Write-Host "Cost: ₹$($response.data.order.cost)" -ForegroundColor Cyan
    Write-Host "Status: $($response.data.order.status)" -ForegroundColor Cyan
    Write-Host "Fampage Order ID: $($response.data.fampageOrderId)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Full Response:" -ForegroundColor White
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
} catch {
    Write-Host ""
    Write-Host "=== ORDER CREATION FAILED ===" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host ""
        Write-Host "Error Details:" -ForegroundColor Yellow
        $_.ErrorDetails.Message | Write-Host
    }
    
    if ($_.Exception.Response) {
        Write-Host ""
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
