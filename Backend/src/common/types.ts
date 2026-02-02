export type PaginationMeta = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export type PaginationParams = {
  limit?: number;
  offset?: number;
};

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;

export function normalizePagination(params: PaginationParams): { limit: number; offset: number } {
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(params.offset ?? 0, 0);
  return { limit, offset };
}

export function buildPaginationMeta(total: number, limit: number, offset: number): PaginationMeta {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}
