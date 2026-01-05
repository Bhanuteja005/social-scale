const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const getPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

const getSortParams = (query, defaultSort = { createdAt: -1 }) => {
  const { sortBy, sortOrder } = query;

  if (!sortBy) {
    return defaultSort;
  }

  const order = sortOrder === "asc" ? 1 : -1;
  return { [sortBy]: order };
};

module.exports = {
  getPaginationParams,
  getPaginationMeta,
  getSortParams,
};
