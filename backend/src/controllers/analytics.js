const analyticsService = require("../services/analytics");

const getCompanyAnalytics = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.query.companyId;
    const analytics = await analyticsService.getCompanyAnalytics(
      companyId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderDetailsByTarget = async (req, res, next) => {
  try {
    const { targetUrl } = req.params;
    const companyId = req.companyId || req.query.companyId;
    const orders = await analyticsService.getOrderDetailsByTarget(
      targetUrl,
      companyId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyOrderHistory = async (req, res, next) => {
  try {
    let { companyId } = req.params;

    // If no companyId in params and user is company-scoped, use their company
    if (!companyId && req.companyId) {
      companyId = req.companyId;
    }

    // If user is not SUPER_ADMIN and trying to access different company, deny access
    if (req.user && !req.user.role.includes('SUPER_ADMIN') && req.companyId && companyId !== req.companyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this company's data"
      });
    }

    const history = await analyticsService.getCompanyOrderHistory(
      companyId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

const getStatisticsSummary = async (req, res, next) => {
  try {
    const { companyId } = req.query;
    const summary = await analyticsService.getStatisticsSummary(
      companyId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanyAnalytics,
  getOrderDetailsByTarget,
  getCompanyOrderHistory,
  getStatisticsSummary,
};
