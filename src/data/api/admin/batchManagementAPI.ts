import { post, put, del } from "../httpClient";
import { BATCH_MANAGEMENT } from "../endPoints";

/* ─────────────────────────────────────────────────────────────────────────────
   BATCH STATS
───────────────────────────────────────────────────────────────────────────── */

/**
 * Fetch batch statistics with optional date filters.
 * @param filterType - "day" | "week" | "month"
 * @param startDate  - "DD-MM-YYYY"
 * @param endDate    - "DD-MM-YYYY"
 */
export const fetchBatchStatsApi = (
  filterType: string,
  startDate?: string,
  endDate?  : string
) => {
  const payload: Record<string, string> = { filterType };
  if (startDate) payload.startDate = startDate;
  if (endDate)   payload.endDate   = endDate;
  return post(BATCH_MANAGEMENT.GET_STATS, payload);
};

/* ─────────────────────────────────────────────────────────────────────────────
   FETCH ALL BATCHES  (paginated + filtered)
───────────────────────────────────────────────────────────────────────────── */

export interface BatchFilters {
  search?       : string;
  status?       : string;
  priority?     : string;
  department?   : string;
  subDepartment?: string;
}

export interface BatchSort {
  field?: string;
  order?: "asc" | "desc";
}

/**
 * Fetch paginated batch list with optional filters, search and sort.
 * @param page    - 1-based page number
 * @param limit   - Records per page
 * @param filters - Optional filter fields
 * @param sort    - Optional sort config (defaults to createdOn desc)
 */
export const fetchAllBatches = (
  page   : number       = 1,
  limit  : number       = 10,
  filters: BatchFilters = {},
  sort   : BatchSort    = { field: "createdOn", order: "desc" }
) => {
  // Strip undefined / empty strings — server expects {} for "no filters"
  const cleanFilters: Record<string, string> = {};
  (Object.entries(filters) as [string, string | undefined][]).forEach(([key, val]) => {
    if (val !== undefined && val !== "") cleanFilters[key] = val;
  });

  const payload = {
    pagination: { page, limit },
    filters   : cleanFilters,
    sort      : {
      field: sort.field ?? "createdOn",
      order: sort.order ?? "desc",
    },
  };

  return post(BATCH_MANAGEMENT.GET_ALL_BATCHES, payload);
};

/* ─────────────────────────────────────────────────────────────────────────────
   FETCH BATCH BY ID
   POST  →  { batchId }
───────────────────────────────────────────────────────────────────────────── */

/**
 * Fetch full details of a single batch.
 * @param batchId - e.g. "BATCH102"
 */
export const fetchBatchById = (batchId: string) =>
  post(BATCH_MANAGEMENT.GET_BATCH_BY_ID, { batchId });

/* ─────────────────────────────────────────────────────────────────────────────
   CREATE BATCH
   POST  →  { batchId, motorId, motorType, projectName, batchType,
              priority, systemManager }
───────────────────────────────────────────────────────────────────────────── */

export interface CreateBatchPayload {
  batchId      : string;
  motorId      : string;
  motorType    : { motorTypeId: number; motorTypeName: string };
  projectName  : string;
  batchType    : string;
  priority     : string;
  systemManager: { id: string; name: string };
}

/**
 * Create a new batch.
 * @param payload - Batch creation fields
 */
export const createBatch = (payload: CreateBatchPayload) =>
  post(BATCH_MANAGEMENT.CREATE_BATCH, payload);

/* ─────────────────────────────────────────────────────────────────────────────
   UPDATE BATCH
   PUT  →  { batchId, motorId, motorType, projectName, batchType,
             priority, systemManager }
───────────────────────────────────────────────────────────────────────────── */

export interface UpdateBatchPayload {
  batchId      : string;
  motorId      : string;
  motorType    : { motorTypeId: number; motorTypeName: string };
  projectName  : string;
  batchType    : string;
  priority     : string;
  systemManager: { id: string; name: string };
}

/**
 * Update an existing batch.
 * @param batchId - ID of the batch to update (used to build the URL)
 * @param payload - Fields to update
 */
export const updateBatch = (batchId: string, payload: UpdateBatchPayload) =>
  put(BATCH_MANAGEMENT.UPDATE_BATCH, payload);

/* ─────────────────────────────────────────────────────────────────────────────
   DELETE BATCH
   DELETE  →  { batchId, reason }
───────────────────────────────────────────────────────────────────────────── */

/**
 * Delete a batch with a mandatory reason.
 * @param batchId - e.g. "BATCH102"
 * @param reason  - Human-readable deletion reason (required by the API)
 */
export const deleteBatch = (batchId: string, reason: string) =>
  del(BATCH_MANAGEMENT.DELETE_BATCH, { data: { batchId, reason } });