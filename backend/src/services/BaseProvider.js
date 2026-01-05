const axios = require("axios");
const logger = require("../config/logger");

class BaseProvider {
  constructor(providerConfig) {
    this.name = providerConfig.name;
    this.baseUrl = providerConfig.baseUrl;
    this.apiKey = providerConfig.apiKey;
    this.apiSecret = providerConfig.apiSecret;
    this.config = providerConfig.config || {};
    this.timeout = this.config.timeout || 30000;
    this.retryAttempts = this.config.retryAttempts || 3;
    this.retryDelay = this.config.retryDelay || 1000;
    this.sandboxMode = this.config.sandboxMode || false;
  }

  async makeRequest(endpoint, method = "GET", data = null, headers = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method,
      url,
      timeout: this.timeout,
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...headers,
      },
    };

    if (data && (method === "POST" || method === "PUT")) {
      config.data = data;
    }

    let lastError;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const startTime = Date.now();
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
          return {
            success: false,
            error: error.response?.data?.message || error.message,
            statusCode,
            duration,
          };
        }

        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          logger.warn(
            `Request failed, retrying in ${delay}ms (attempt ${attempt}/${this.retryAttempts})`
          );
          await this.sleep(delay);
        }
      }
    }

    return {
      success: false,
      error:
        lastError?.response?.data?.message ||
        lastError?.message ||
        "Request failed",
      statusCode: lastError?.response?.status || 500,
      duration: 0,
    };
  }

  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "X-API-Key": this.apiKey,
    };
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async orderFollowers(accountId, quantity) {
    throw new Error("orderFollowers must be implemented by subclass");
  }

  async orderLikes(postId, quantity) {
    throw new Error("orderLikes must be implemented by subclass");
  }

  async orderComments(postId, quantity) {
    throw new Error("orderComments must be implemented by subclass");
  }

  async orderShares(postId, quantity) {
    throw new Error("orderShares must be implemented by subclass");
  }

  async getOrderStatus(orderId) {
    throw new Error("getOrderStatus must be implemented by subclass");
  }
}

module.exports = BaseProvider;
