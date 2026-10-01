/**
 * The response envelope every admin API route answers with.
 *
 * TRAP: `status: false` is a failed operation even on HTTP 200. Write call
 * sites must go through `unwrapApiResponse`, which throws, so the existing
 * `catch` decides presentation. A missing response (`undefined`) means the
 * request never completed — a different case from `status: false`.
 */

export interface PaginationMeta {
  page: number;
  pageCount: number;
  total: number;
}

export interface ApiResponse<T> {
  /** false = the operation failed; read `message`. */
  status: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

/** Error carrying the HTTP status so callers can branch (401, 409…). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function unwrapApiResponse<T>(
  res: ApiResponse<T> | undefined,
  fallback: string,
  httpStatus?: number,
): ApiResponse<T> {
  if (!res) throw new ApiError(fallback, httpStatus);
  if (!res.status) {
    throw new ApiError(res.message?.trim() || fallback, httpStatus);
  }
  return res;
}

/** Server-side builders, so every route emits the same shape. */
export function apiOk<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  return meta ? { status: true, data, meta } : { status: true, data };
}

export function apiFail(message: string): ApiResponse<null> {
  return { status: false, data: null, message };
}

/**
 * fetch → envelope. Returns `undefined` only when the request never completed
 * or the body wasn't JSON; never throws for HTTP errors (unwrap does that).
 */
export async function fetchEnvelope<T>(
  input: string,
  init?: RequestInit,
): Promise<{ httpStatus: number; body: ApiResponse<T> | undefined }> {
  const res = await fetch(input, init);
  const body = (await res.json().catch(() => undefined)) as
    | ApiResponse<T>
    | undefined;
  return { httpStatus: res.status, body };
}
