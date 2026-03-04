const getCursorPagination = (query) => {
  const limit = query.limit || 10;
  const cursor = query.cursor ? query.cursor : undefined;
  const cursorOption = {
    take: parseInt(limit) + 1,
    skip: cursor ? 1 : undefined,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: {
      id: "asc",
    },
  };
  return { limit, cursorOption };
};

const getCursorPaginationResponse = (items, limit) => {
  const hasNextPage = items.length > limit;
  if (hasNextPage) {
    items.pop();
  }
  const nextCursor = hasNextPage ? items[items.length - 1].id.toString() : null;
  return { nextCursor, hasNextPage, limit };
};

module.exports = {
  getCursorPagination,
  getCursorPaginationResponse,
};
