# Social Scale Backend - API Testing Guide

## 🚀 Quick Start - Get Fresh Token

Since your token expired, first login to get a new access token:

```powershell
# Login and get fresh token
$loginBody = @{
    email = "admin@socialscale.com"
    password = "Admin@12345"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
$loginData = $loginResponse.Content | ConvertFrom-Json

# Extract the access token
$token = $loginData.data.accessToken
Write-Host "New Token: $token"
```

**Copy the token** - you'll need it for all API calls!

---
 $servicesData.data.categorized.services | Where-Object { $_.name -like "*follow*" -and $_.min -le 100 -and $_.max -ge 100 } | Select-Object service, name, rate, min, max | Format-Table

## 📋 API Endpoints & Testing

### 1. ✅ Check Balance (Verify Fampay Integration)

```powershell
$headers = @{Authorization = "Bearer $token"}
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/api-integrations/balance" -Method GET -Headers $headers -UseBasicParsing
$response.Content
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Balance retrieved successfully",
  "data": {
    "balance": "16.6132",
    "currency": "INR"
  },
  "balance": "16.6132",
  "currency": "INR",
  "statusCode": 200
}
```

---

### 2. ✅ Get Available Services

```powershell
$headers = @{Authorization = "Bearer $token"}
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/api-integrations/services" -Method GET -Headers $headers -UseBasicParsing
$response.Content
```

**Filter Instagram services:**
```powershell
$headers = @{Authorization = "Bearer $token"}
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/api-integrations/services?network=Instagram" -Method GET -Headers $headers -UseBasicParsing
$response.Content
```

---

### 3. ✅ Get Company ID

```powershell
$headers = @{Authorization = "Bearer $token"}
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/companies" -Method GET -Headers $headers -UseBasicParsing
$companyData = $response.Content | ConvertFrom-Json
$companyId = $companyData.data.data[0].companyId
Write-Host "Company ID: $companyId"
```

---

### 4. 🚀 Create Instagram Followers Order

**Find a suitable service first:**
```powershell
$headers = @{Authorization = "Bearer $token"}
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/api-integrations/services?network=Instagram" -Method GET -Headers $headers -UseBasicParsing
$services = ($response.Content | ConvertFrom-Json).data.categorized

# Find services with quantity 100 in range
$services.services | Where-Object { $_.min -le 100 -and $_.max -ge 100 } | Select-Object service, name, rate, min, max | Format-Table
```

**Create the order (using service 4277 as in your example):**
```powershell
$headers = @{Authorization = "Bearer $token"}
$orderBody = @{
    companyId = "e6972aee-388f-4d01-b965-7ba1385880f1"
    service = 4277
    link = "https://www.instagram.com/bhanuteja__005"
    quantity = 100
    serviceName = "Instagram Followers"
    serviceType = "follow"
    invoiceMultiplier = 8
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/api-integrations/orders" -Method POST -Body $orderBody -ContentType "application/json" -Headers $headers -UseBasicParsing
$orderResult = $response.Content | ConvertFrom-Json

# Extract order ID for status checking
$apiOrderId = $orderResult.apiOrderId
Write-Host "Order created! Fampay Order ID: $apiOrderId"
```

---

### 5. ✅ Check Order Status

```powershell
$headers = @{Authorization = "Bearer $token"}
# Replace 203521833 with your actual order ID
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/api-integrations/orders/$apiOrderId/status" -Method GET -Headers $headers -UseBasicParsing
$response.Content
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order status retrieved successfully",
  "data": {
    "charge": "9.9980",
    "start_count": 0,
    "status": "In progress",
    "remains": "100",
    "currency": "INR"
  },
  "order": null,
  "statusCode": 200
}
```

---

### 6. ✅ Get All Orders

```powershell
$headers = @{Authorization = "Bearer $token"}
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/orders" -Method GET -Headers $headers -UseBasicParsing
$response.Content
```

---

### 7. ✅ View Analytics Dashboard

```powershell
$headers = @{Authorization = "Bearer $token"}
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/analytics/dashboard?companyId=e6972aee-388f-4d01-b965-7ba1385880f1" -Method GET -Headers $headers -UseBasicParsing
$response.Content
```

---

## 🔄 Complete Testing Workflow

Here's a complete PowerShell script to test everything:

```powershell
# Step 1: Login
Write-Host "🔐 Logging in..."
$loginBody = @{
    email = "admin@socialscale.com"
    password = "Admin@12345"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.data.accessToken
Write-Host "✅ Token obtained"

# Step 2: Check Balance
Write-Host "💰 Checking balance..."
$headers = @{Authorization = "Bearer $token"}
$balanceResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/api-integrations/balance" -Method GET -Headers $headers -UseBasicParsing
$balanceData = $balanceResponse.Content | ConvertFrom-Json
Write-Host "Balance: $($balanceData.balance) $($balanceData.currency)"

# Step 3: Get Company ID
Write-Host "🏢 Getting company..."
$companyResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/companies" -Method GET -Headers $headers -UseBasicParsing
$companyData = $companyResponse.Content | ConvertFrom-Json
$companyId = $companyData.data.data[0].companyId
Write-Host "Company ID: $companyId"

# Step 4: Create Order (Uncomment to actually create)
Write-Host "📦 Creating order..."
$orderBody = @{
    companyId = $companyId
    service = 4277
    link = "https://www.instagram.com/bhanuteja__005"
    quantity = 100
    serviceName = "Instagram Followers"
    serviceType = "follow"
    invoiceMultiplier = 8
} | ConvertTo-Json

# Uncomment the next line to actually create the order
# $orderResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/api-integrations/orders" -Method POST -Body $orderBody -ContentType "application/json" -Headers $headers -UseBasicParsing
# Write-Host "Order created!"

Write-Host "🎉 Testing complete!"
```

---

## 📊 Understanding API Responses

### Order Status Meanings:
- `"In progress"` - Followers are being delivered
- `"Completed"` - All followers delivered ✅
- `"Partial"` - Some followers delivered
- `"Awaiting"` - Waiting to start
- `"Canceled"` - Order canceled
- `"Fail"` - Order failed

### Key Fields:
- `charge` - Amount charged by Fampay
- `start_count` - Follower count when order started
- `remains` - Followers still to be delivered
- `status` - Current order status

---

## 🛠️ Troubleshooting

### Token Expired
```powershell
# Login again
$loginBody = @{email="admin@socialscale.com"; password="Admin@12345"} | ConvertTo-Json
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
$token = ($loginResponse.Content | ConvertFrom-Json).data.accessToken
```

### Server Not Running
```bash
cd C:\Users\pashi\Downloads\social_scale_backend
npm run dev
```

### Database Not Seeded
```bash
npm run seed
```

---

## 🎯 Ready to Test!

1. **Get fresh token** using the login command above
2. **Check balance** to confirm Fampay connection
3. **Create order** for 100 Instagram followers
4. **Monitor status** until completion
5. **View analytics** to see profit tracking

Your balance shows ₹16.61 INR, which is enough for the order. The system will automatically create an invoice with 8x markup for profit tracking.

**Happy testing! 🚀**