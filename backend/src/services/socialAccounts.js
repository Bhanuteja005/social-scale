const SocialAccount = require("../models/SocialAccount");
const Company = require("../models/Company");
const { NotFoundError, AppError } = require("../utils/errors");
const { getPaginationParams } = require("../utils/pagination");

// Create a social account for a company
const createSocialAccount = async (accountData, userRole, userCompanyId) => {
  const { companyId, platform, accountName, accountUrl, username, accountType, notes, metadata } = accountData;

  // Verify company exists - use companyId field instead of _id
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) {
    throw new NotFoundError("Company");
  }

  // Permission check: Only SUPER_ADMIN can add accounts to any company
  if (userRole !== "SUPER_ADMIN" && company.companyId !== userCompanyId) {
    throw new AppError("You can only add social accounts to your own company", 403);
  }

  // Check if this account URL already exists for this company
  const existingAccount = await SocialAccount.findOne({ companyId: company._id, accountUrl });
  if (existingAccount) {
    throw new AppError("This social account URL is already registered for this company", 400);
  }

  const socialAccountData = {
    companyId: company._id,
    platform,
    accountName,
    accountUrl,
    username,
    accountType,
    notes,
    isActive: true,
  };

  // Only add metadata if it exists
  if (metadata) {
    socialAccountData.metadata = metadata;
  }

  const socialAccount = await SocialAccount.create(socialAccountData);
  return socialAccount;
};

// Get all social accounts for a company
const getCompanySocialAccounts = async (companyId, filters = {}) => {
  // First find the company to get its _id
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) {
    throw new NotFoundError("Company");
  }

  const query = { companyId: company._id };

  if (filters.platform) {
    query.platform = filters.platform;
  }

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive === "true" || filters.isActive === true;
  }

  const socialAccounts = await SocialAccount.find(query)
    .sort({ platform: 1, createdAt: -1 })
    .populate("companyId", "name");

  return socialAccounts;
};

// Get a single social account by ID
const getSocialAccountById = async (accountId) => {
  const socialAccount = await SocialAccount.findById(accountId).populate("companyId", "name");

  if (!socialAccount) {
    throw new NotFoundError("Social Account");
  }

  return socialAccount;
};

// Update a social account
const updateSocialAccount = async (accountId, updateData, userRole, userCompanyId) => {
  const socialAccount = await SocialAccount.findById(accountId).populate("companyId");

  if (!socialAccount) {
    throw new NotFoundError("Social Account");
  }

  // Permission check
  if (userRole !== "SUPER_ADMIN" && socialAccount.companyId.companyId !== userCompanyId) {
    throw new AppError("You can only update social accounts for your own company", 403);
  }

  // Update fields
  const allowedUpdates = ["accountName", "accountUrl", "username", "accountType", "notes", "isActive", "metadata"];
  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      socialAccount[field] = updateData[field];
    }
  });

  await socialAccount.save();

  return socialAccount;
};

// Delete a social account
const deleteSocialAccount = async (accountId, userRole, userCompanyId) => {
  const socialAccount = await SocialAccount.findById(accountId).populate("companyId");

  if (!socialAccount) {
    throw new NotFoundError("Social Account");
  }

  // Permission check
  if (userRole !== "SUPER_ADMIN" && socialAccount.companyId.companyId !== userCompanyId) {
    throw new AppError("You can only delete social accounts for your own company", 403);
  }

  await socialAccount.deleteOne();
};

// Get all social accounts (for admin dashboard)
const getAllSocialAccounts = async (query = {}) => {
  const pagination = getPaginationParams(query);
  
  const filter = {};
  if (query.platform) {
    filter.platform = query.platform;
  }
  if (query.companyId) {
    filter.companyId = query.companyId;
  }
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true" || query.isActive === true;
  }

  const total = await SocialAccount.countDocuments(filter);
  const socialAccounts = await SocialAccount.find(filter)
    .populate("companyId", "name")
    .sort({ createdAt: -1 })
    .limit(pagination.limit)
    .skip(pagination.skip);

  return {
    socialAccounts,
    pagination: {
      ...pagination,
      total,
      pages: Math.ceil(total / pagination.limit),
    },
  };
};

module.exports = {
  createSocialAccount,
  getCompanySocialAccounts,
  getSocialAccountById,
  updateSocialAccount,
  deleteSocialAccount,
  getAllSocialAccounts,
};
