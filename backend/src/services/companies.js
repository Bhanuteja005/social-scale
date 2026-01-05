const Company = require("../models/Company");
const { NotFoundError, AppError } = require("../utils/errors");
const roles = require("../config/roles");

const createCompany = async (companyData) => {
  const company = await Company.create(companyData);
  return company.toJSON();
};

const getCompanyById = async (companyId, userRole, userCompanyId) => {
  const company = await Company.findOne({
    companyId,
    deletedAt: null,
  });

  if (!company) {
    throw new NotFoundError("Company");
  }

  if (!roles.isSuperAdmin(userRole) && company.companyId !== userCompanyId) {
    throw new AppError("Access denied to this company", 403);
  }

  return company.toJSON();
};

const getAllCompanies = async (query, userRole, userCompanyId) => {
  const { page, limit, skip } = query;
  const filter = { deletedAt: null };

  if (!roles.isSuperAdmin(userRole)) {
    filter.companyId = userCompanyId;
  }

  const companies = await Company.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Company.countDocuments(filter);

  return {
    companies: companies.map((c) => c.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateCompany = async (
  companyId,
  updateData,
  userRole,
  userCompanyId
) => {
  const company = await Company.findOne({
    companyId,
    deletedAt: null,
  });

  if (!company) {
    throw new NotFoundError("Company");
  }

  if (!roles.isSuperAdmin(userRole) && company.companyId !== userCompanyId) {
    throw new AppError("Access denied to this company", 403);
  }

  Object.assign(company, updateData);
  company.updatedAt = new Date();
  await company.save();

  return company.toJSON();
};

const deleteCompany = async (companyId, userRole, userCompanyId) => {
  const company = await Company.findOne({
    companyId,
    deletedAt: null,
  });

  if (!company) {
    throw new NotFoundError("Company");
  }

  if (!roles.isSuperAdmin(userRole)) {
    throw new AppError("Only super admins can delete companies", 403);
  }

  await company.softDelete();
  return { message: "Company deleted successfully" };
};

const restoreCompany = async (companyId, userRole) => {
  if (!roles.isSuperAdmin(userRole)) {
    throw new AppError("Only super admins can restore companies", 403);
  }

  const company = await Company.findOne({
    companyId,
    deletedAt: { $ne: null },
  });

  if (!company) {
    throw new NotFoundError("Company");
  }

  await company.restore();
  return company.toJSON();
};

module.exports = {
  createCompany,
  getCompanyById,
  getAllCompanies,
  updateCompany,
  deleteCompany,
  restoreCompany,
};
