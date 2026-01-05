const { AppError } = require("../utils/errors");

const notFound = (req, res, next) => {
  throw new AppError(`Route ${req.originalUrl} not found`, 404);
};

module.exports = notFound;
