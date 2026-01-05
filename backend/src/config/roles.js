module.exports = {
  SUPER_ADMIN: "SUPER_ADMIN",
  COMPANY_ADMIN: "COMPANY_ADMIN",
  COMPANY_USER: "COMPANY_USER",

  getAll: () => ["SUPER_ADMIN", "COMPANY_ADMIN", "COMPANY_USER"],

  isSuperAdmin: (role) => role === "SUPER_ADMIN",

  isCompanyAdmin: (role) => role === "COMPANY_ADMIN",

  isCompanyUser: (role) => role === "COMPANY_USER",

  canManageCompany: (role) => ["SUPER_ADMIN", "COMPANY_ADMIN"].includes(role),

  canManageUsers: (role) => ["SUPER_ADMIN", "COMPANY_ADMIN"].includes(role),

  requiresCompany: (role) => role !== "SUPER_ADMIN",
};
