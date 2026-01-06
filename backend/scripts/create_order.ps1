# Check available Instagram services
$headers = @{Authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTUyN2ZhZTZkMDA1N2QzZGNjNmUwN2IiLCJlbWFpbCI6ImFkbWluQHNvY2lhbHNjYWxlLmNvbSIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImNvbXBhbnlJZCI6bnVsbCwiaWF0IjoxNzY3NTM3NTQ2LCJleHAiOjE3Njc1MzkzNDZ9.8vDpSRIroZnJ4b_VagcKTNxMTjC2FsP4gax9YK5cz70"}

Write-Host "Finding available Instagram follower services..."

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/api-integrations/services?network=Instagram" -Method GET -Headers $headers -UseBasicParsing
    $servicesData = $response.Content | ConvertFrom-Json

    if ($servicesData.success -and $servicesData.data.categorized) {
        $instagramServices = $servicesData.data.categorized | Where-Object { $_.network -eq "Instagram" }

        if ($instagramServices.services) {
            Write-Host "Available Instagram Follower Services (min<=100, max>=100):"
            Write-Host ("-" * 80)

            $followerServices = $instagramServices.services | Where-Object {
                $_.name -like "*follow*" -and
                [int]$_.min -le 100 -and
                [int]$_.max -ge 100
            }

            if ($followerServices.Count -gt 0) {
                $followerServices | ForEach-Object {
                    Write-Host "Service ID: $($_.service)"
                    Write-Host "Name: $($_.name)"
                    Write-Host "Rate: $($_.rate) per 1000"
                    Write-Host "Min/Max: $($_.min) - $($_.max)"
                    Write-Host ("-" * 40)
                }

                # Pick the first available service
                $selectedService = $followerServices[0]
                Write-Host "Using Service ID: $($selectedService.service) - $($selectedService.name)"
                Write-Host ""

                # Create the order
                Write-Host "Creating order for 100 Instagram followers..."

                $orderBody = @{
                    companyId = "e6972aee-388f-4d01-b965-7ba1385880f1"
                    service = [int]$selectedService.service
                    link = "https://www.instagram.com/bhanuteja__005"
                    quantity = 100
                    serviceName = "Instagram Followers"
                    serviceType = "follow"
                    invoiceMultiplier = 8
                } | ConvertTo-Json

                try {
                    $orderResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/api-integrations/orders" -Method POST -Body $orderBody -ContentType "application/json" -Headers $headers -UseBasicParsing
                    $orderResult = $orderResponse.Content | ConvertFrom-Json

                    if ($orderResult.success) {
                        Write-Host "Order created successfully!"
                        Write-Host "Fampay Order ID: $($orderResult.apiOrderId)"
                        Write-Host "Internal Order ID: $($orderResult.orderId)"
                        Write-Host ""
                        Write-Host "Check status with:"
                        Write-Host "Invoke-WebRequest -Uri 'http://localhost:3000/api/v1/api-integrations/orders/$($orderResult.apiOrderId)/status' -Method GET -Headers `$headers -UseBasicParsing | Select-Object -ExpandProperty Content"
                    } else {
                        Write-Host "Order creation failed:"
                        Write-Host "Message: $($orderResult.message)"
                        Write-Host "Error: $($orderResult.error)"
                        Write-Host "Full response:"
                        Write-Host $orderResponse.Content
                    }
                } catch {
                    Write-Host "Order creation failed with HTTP error:"
                    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
                    Write-Host "Status Description: $($_.Exception.Response.StatusDescription)"
                    try {
                        $errorContent = $_.Exception.Response.GetResponseStream()
                        $reader = New-Object System.IO.StreamReader($errorContent)
                        $errorResponse = $reader.ReadToEnd()
                        Write-Host "Error Response:"
                        Write-Host $errorResponse
                    } catch {
                        Write-Host "Could not read error response"
                    }
                }
            } else {
                Write-Host "No suitable follower services found for quantity 100"
            }
        } else {
            Write-Host "No Instagram services found"
        }
    } else {
        Write-Host "Failed to get services"
        Write-Host $servicesData.error
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}