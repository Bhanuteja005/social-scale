const companyService = require("../services/companies");
const { getPaginationParams } = require("../utils/pagination");

const createCompany = async (req, res, next) => {
  try {
    const company = await companyService.createCompany(req.body);
    
    // If the user doesn't have a company, associate them with the newly created company
    if (!req.user.companyId && req.user.role === 'COMPANY_USER') {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user.userId, { companyId: company.companyId });
      
      // Update the user object in the request for immediate effect
      req.user.companyId = company.companyId;
    }

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyById = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const company = await companyService.getCompanyById(
      companyId,
      req.user.role,
      req.user.companyId
    );

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

const getAllCompanies = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const result = await companyService.getAllCompanies(
      pagination,
      req.user.role,
      req.user.companyId
    );

    res.status(200).json({
      success: true,
      data: result.companies,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const company = await companyService.updateCompany(
      companyId,
      req.body,
      req.user.role,
      req.user.companyId
    );

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const result = await companyService.deleteCompany(
      companyId,
      req.user.role,
      req.user.companyId
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const restoreCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const company = await companyService.restoreCompany(
      companyId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: "Company restored successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCompany,
  getCompanyById,
  getAllCompanies,
  updateCompany,
  deleteCompany,
  restoreCompany,
};
