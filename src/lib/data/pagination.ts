export const PAGE_SIZE = 10;

export type Paginated<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function parsePage(value: string | undefined) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function paginate<T>(rows: T[], total: number, page: number, pageSize = PAGE_SIZE): Paginated<T> {
  return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}
