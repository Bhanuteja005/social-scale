const socialAccountService = require("../services/socialAccounts");

// Create social account
const createSocialAccount = async (req, res, next) => {
  try {
    const accountData = req.body;
    const userRole = req.user.role;
    const userCompanyId = req.user.companyId;

    const socialAccount = await socialAccountService.createSocialAccount(accountData, userRole, userCompanyId);

    res.status(201).json({
      success: true,
      message: "Social account created successfully",
      data: socialAccount,
    });
  } catch (error) {
    next(error);
  }
};

// Get all social accounts for a company
const getCompanySocialAccounts = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const filters = req.query;

    const socialAccounts = await socialAccountService.getCompanySocialAccounts(companyId, filters);

    res.status(200).json({
      success: true,
      data: socialAccounts,
    });
  } catch (error) {
    next(error);
  }
};

// Get single social account
const getSocialAccountById = async (req, res, next) => {
  try {
    const { accountId } = req.params;

    const socialAccount = await socialAccountService.getSocialAccountById(accountId);

    res.status(200).json({
      success: true,
      data: socialAccount,
    });
  } catch (error) {
    next(error);
  }
};

// Update social account
const updateSocialAccount = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const updateData = req.body;
    const userRole = req.user.role;
    const userCompanyId = req.user.companyId;

    const socialAccount = await socialAccountService.updateSocialAccount(accountId, updateData, userRole, userCompanyId);

    res.status(200).json({
      success: true,
      message: "Social account updated successfully",
      data: socialAccount,
    });
  } catch (error) {
    next(error);
  }
};

// Delete social account
const deleteSocialAccount = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const userRole = req.user.role;
    const userCompanyId = req.user.companyId;

    await socialAccountService.deleteSocialAccount(accountId, userRole, userCompanyId);

    res.status(200).json({
      success: true,
      message: "Social account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get all social accounts (admin)
const getAllSocialAccounts = async (req, res, next) => {
  try {
    const query = req.query;

    const result = await socialAccountService.getAllSocialAccounts(query);

    res.status(200).json({
      success: true,
      data: result.socialAccounts,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSocialAccount,
  getCompanySocialAccounts,
  getSocialAccountById,
  updateSocialAccount,
  deleteSocialAccount,
  getAllSocialAccounts,
};
