const BaseProvider = require("./BaseProvider");
const axios = require("axios");
const logger = require("../config/logger");

class FampageProvider extends BaseProvider {
  constructor(providerConfig) {
    super(providerConfig);
    this.apiKey = providerConfig.apiKey;
  }

  // Override getAuthHeaders for Fampage API (uses query param, not headers)
  getAuthHeaders() {
    return {};
  }

  // Make request with query parameters for Fampage API
  async makeQueryRequest(action, params = {}, method = "GET") {
    const queryParams = new URLSearchParams({
      action,
      key: this.apiKey,
      ...params,
    });

    const url = `${this.baseUrl}?${queryParams.toString()}`;

    let lastError;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const startTime = Date.now();
        const config = {
          method,
          url,
          timeout: this.timeout,
          headers: {
            "Content-Type": "application/json",
          },
        };

        const response = await axios(config);
        const duration = Date.now() - startTime;

        return {
          success: true,
          data: response.data,
          statusCode: response.status,
          duration,
        };
      } catch (error) {
        lastError = error;
        const statusCode = error.response?.status;
        const duration = error.response?.duration || 0;

        if (statusCode && statusCode < 500) {
          // Fampage API returns errors in different formats:
          // - {"error": "insufficient_funds"}
          // - {"message": "error message"}
          // Include the response data so caller can see the full error
          const errorData = error.response?.data;
          const errorMessage =
            errorData?.error ||
            errorData?.message ||
            (typeof errorData === "string" ? errorData : null) ||
            error.message;

          return {
            success: false,
            error: errorMessage,
            statusCode,
            duration,
            data: errorData, // Include full response data (may contain order ID or error details)
          };
        }

        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          logger.warn(
            `Fampage request failed, retrying in ${delay}ms (attempt ${attempt}/${this.retryAttempts})`
          );
          await this.sleep(delay);
        }
      }
    }

    const errorData = lastError?.response?.data;
    const errorMessage =
      errorData?.error ||
      errorData?.message ||
      (typeof errorData === "string" ? errorData : null) ||
      lastError?.message ||
      "Request failed";

    return {
      success: false,
      error: errorMessage,
      statusCode: lastError?.response?.status || 500,
      duration: 0,
      data: errorData, // Include full response data
    };
  }

  // Get list of services
  async getServices() {
    return await this.makeQueryRequest("services");
  }

  // Create order (add) - POST request
  async addOrder(service, link, quantity) {
    return await this.makeQueryRequest(
      "add",
      {
        service: service.toString(),
        link,
        quantity: quantity.toString(),
      },
      "POST"
    );
  }

  // Get single order status
  async getOrderStatus(orderId) {
    return await this.makeQueryRequest("status", {
      order: orderId.toString(),
    });
  }

  // Get multiple orders status
  async getOrdersStatus(orderIds) {
    const ordersParam = Array.isArray(orderIds)
      ? orderIds.join(",")
      : orderIds.toString();
    return await this.makeQueryRequest("status", {
      orders: ordersParam,
    });
  }

  // Refill order - POST request
  async refillOrder(orderId) {
    return await this.makeQueryRequest(
      "refill",
      {
        order: orderId.toString(),
      },
      "POST"
    );
  }

  // Get balance
  async getBalance() {
    return await this.makeQueryRequest("balance");
  }

  // Cancel order - POST request
  async cancelOrder(orderId) {
    return await this.makeQueryRequest(
      "cancel",
      {
        order: orderId.toString(),
      },
      "POST"
    );
  }
}

module.exports = FampageProvider;
