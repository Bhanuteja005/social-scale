Write-Host "=== Testing Order Creation ===" -ForegroundColor Cyan

# Login
$loginBody = @{
    email = "admin@socialscale.com"
    password = "Admin@12345"
} | ConvertTo-Json

$loginResp = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/login" `
    -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing

$token = ($loginResp.Content | ConvertFrom-Json).data.accessToken
$headers = @{Authorization = "Bearer $token"}
Write-Host "[OK] Logged in" -ForegroundColor Green

# Get company
$companyResp = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/companies" `
    -Method GET -Headers $headers -UseBasicParsing
$company = (($companyResp.Content | ConvertFrom-Json).data)[0]
Write-Host "[OK] Company: $($company.name)" -ForegroundColor Green

# Get services
$servResp = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/api-integrations/services" `
    -Method GET -Headers $headers -UseBasicParsing
$servData = ($servResp.Content | ConvertFrom-Json).data

# Find cheap Instagram likes service (10 qty)
$instagram = $servData.categorized | Where-Object { $_.network -eq 'Instagram' }
$likeServices = $instagram.services | Where-Object { 
    $_.category -like '*Likes*' -and 
    $_.min -le 10 -and 
    $_.max -ge 10 
} | Sort-Object { [decimal]$_.rate } | Select-Object -First 1

if ($likeServices) {
    Write-Host "[OK] Service: $($likeServices.name)" -ForegroundColor Green
    Write-Host "  Min: $($likeServices.min), Max: $($likeServices.max)" -ForegroundColor Gray
    Write-Host "  Rate: Rs $($likeServices.rate) per unit" -ForegroundColor Gray
    $totalCost = [decimal]$likeServices.rate * 10
    Write-Host "  Total cost for 10: Rs $([math]::Round($totalCost, 2))" -ForegroundColor Gray

    # Create order
    $orderBody = @{
        companyId = $company.companyId
        service = $likeServices.service
        link = "https://www.instagram.com/p/DKHg-jNPK7B/"
        quantity = 10
        serviceName = $likeServices.name
        serviceType = "like"
        invoiceMultiplier = 8
    } | ConvertTo-Json

    try {
        $orderResp = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/api-integrations/orders" `
            -Method POST -Body $orderBody -ContentType "application/json" `
            -Headers $headers -UseBasicParsing
        
        $order = $orderResp.Content | ConvertFrom-Json
        
        Write-Host "`n=== ORDER CREATED SUCCESSFULLY ===" -ForegroundColor Green
        Write-Host "Order ID: $($order.orderId)" -ForegroundColor Yellow
        Write-Host "API Order ID: $($order.apiOrderId)" -ForegroundColor Yellow
        Write-Host "Cost: Rs $($order.order.cost)" -ForegroundColor Yellow
        Write-Host "Invoice Total: Rs $($order.invoice.totalAmount)" -ForegroundColor Yellow
        Write-Host "Profit: Rs $([math]::Round($order.invoice.totalAmount - $order.order.cost, 2))" -ForegroundColor Green
    } catch {
        Write-Host "`n=== ORDER FAILED ===" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host $_.ErrorDetails.Message -ForegroundColor Red
        }
    }
} else {
    Write-Host "[FAIL] No suitable likes service found" -ForegroundColor Red
}
