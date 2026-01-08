const User = require("../models/User");
const Company = require("../models/Company");
const { NotFoundError, AppError } = require("../utils/errors");
const roles = require("../config/roles");

const createUser = async (userData) => {
  const { email, password, role, companyId } = userData;

  // Validate role
  if (!roles.getAll().includes(role)) {
    throw new AppError("Invalid role specified", 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  // For company users, verify company exists
  if (role !== roles.SUPER_ADMIN) {
    if (!companyId) {
      throw new AppError("Company ID is required for company users", 400);
    }

    const company = await Company.findById(companyId);
    if (!company) {
      throw new AppError("Invalid company ID", 400);
    }
  }

  const user = await User.create({
    email,
    password,
    role,
    companyId: role === roles.SUPER_ADMIN ? null : companyId,
    status: "active",
  });

  return user.toJSON();
};

const getUserById = async (userId, currentUser) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User");
  }

  // Users can only see their own profile, SUPER_ADMIN can see all
  if (!roles.isSuperAdmin(currentUser.role) && user._id.toString() !== currentUser.userId) {
    throw new AppError("Access denied", 403);
  }

  return user.toJSON();
};

const getAllUsers = async (query) => {
  const { page, limit, skip, role, status } = query;

  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;

  const users = await User.find(filter)
    .select("-password -passwordResetToken -passwordResetExpires")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(filter);

  return {
    users: users.map((u) => u.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getCompanyUsers = async (companyId, query) => {
  const { page, limit, skip, role, status } = query;

  const filter = { companyId };
  if (role) filter.role = role;
  if (status) filter.status = status;

  const users = await User.find(filter)
    .select("-password -passwordResetToken -passwordResetExpires")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(filter);

  return {
    users: users.map((u) => u.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateUser = async (userId, updateData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User");
  }

  const { email, role, companyId, status } = updateData;

  // Check email uniqueness if changing email
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }
    user.email = email;
  }

  // Update other fields
  if (role) user.role = role;
  if (companyId !== undefined) user.companyId = companyId;
  if (status) user.status = status;
  if (updateData.profile) {
    user.profile = { ...user.profile, ...updateData.profile };
  }

  await user.save();
  return user.toJSON();
};

const deleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User");
  }

  // Prevent deleting SUPER_ADMIN
  if (user.role === roles.SUPER_ADMIN) {
    throw new AppError("Cannot delete SUPER_ADMIN user", 403);
  }

  await user.deleteOne();
};

module.exports = {
  createUser,
  getUserById,
  getAllUsers,
  getCompanyUsers,
  updateUser,
  deleteUser,
};