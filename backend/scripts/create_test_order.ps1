Write-Host "🚀 Creating 10 Instagram Followers Order..." -ForegroundColor Cyan

# Login
$loginBody = @{
    email = "admin@socialscale.com"
    password = "Admin@12345"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/login" `
    -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
$token = ($loginResponse.Content | ConvertFrom-Json).data.accessToken
Write-Host "✅ Logged in" -ForegroundColor Green

# Get company
$headers = @{Authorization = "Bearer $token"}
$companyResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/companies" `
    -Method GET -Headers $headers -UseBasicParsing
$companyId = (($companyResponse.Content | ConvertFrom-Json).data[0]).companyId
Write-Host "✅ Company ID: $companyId" -ForegroundColor Green

# Create order
$orderBody = @{
    companyId = $companyId
    service = 2279
    link = "https://instagram.com/testaccount"
    quantity = 10
    serviceName = "Instagram Followers Good Quality"
    serviceType = "follow"
    invoiceMultiplier = 8
} | ConvertTo-Json

Write-Host "`n📦 Creating order..." -ForegroundColor Yellow

try {
    $orderResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/api-integrations/orders" `
        -Method POST -Body $orderBody -ContentType "application/json" -Headers $headers -UseBasicParsing
    
    $order = $orderResponse.Content | ConvertFrom-Json
    
    Write-Host "`n✅ ORDER CREATED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Order ID:        $($order.orderId)" -ForegroundColor White
    Write-Host "Fampay Order ID: $($order.apiOrderId)" -ForegroundColor White
    Write-Host "Quantity:        10 followers" -ForegroundColor White
    Write-Host "Cost (actual):   Rs.$($order.order.cost)" -ForegroundColor Cyan
    Write-Host "Invoice (8x):    Rs.$($order.invoice.totalAmount)" -ForegroundColor Yellow
    $profit = [math]::Round($order.invoice.totalAmount - $order.order.cost, 2)
    Write-Host "Profit:          Rs.$profit" -ForegroundColor Green
    Write-Host "Status:          $($order.order.status)" -ForegroundColor Magenta
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
} catch {
    Write-Host "`n❌ ORDER FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}
