import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { STRINGS } from "../../../app/config/strings";
import rocketMotorCasingController from "../../../controllers/user/sourcing/rocketMotorCasingController";
import { normalizeRocketCasingListStatus } from "../../../data/models/user/RocketMotorCasingProcurementModel";
import { OPERATION_STATUS } from "../../operationStatus";
import type { RocketMotorBatch } from "./sourcingWorkflowData";

const UI_STATUS_TO_API: Record<string, string> = {
  [OPERATION_STATUS.INITIATED]: "INITIATED",
  [OPERATION_STATUS.IN_PROGRESS]: "IN_PROGRESS",
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: "WAITING_FOR_APPROVAL",
  [OPERATION_STATUS.APPROVED]: "APPROVED",
  [OPERATION_STATUS.REJECTED]: "REJECTED",
};

/** Map list API row → batch shape used by RocketMotorBatchList / form hook */
export function mapRocketMotorCasingListRow(row: Record<string, unknown>): RocketMotorBatch {
  const procurementId = String(row?.procurementId ?? "");
  const motorCasingId = String(row?.motorCasingId ?? "");
  const motorStage = String(row?.motorStage ?? "");
  const motorNo = String(row?.motorNo ?? "");
  const statusRaw = String(row?.status ?? "");
  const rmStatus = normalizeRocketCasingListStatus(statusRaw);

  return {
    id: motorCasingId || procurementId,
    formId: procurementId || null,
    procurementId: procurementId || null,
    motorCasingId,
    motorStage,
    motorNo,
    casingType: String(row?.casingType ?? ""),
    insulationType: String(row?.insulationType ?? ""),
    receivingDate: String(row?.receivingDate ?? ""),
    nextStep: row?.nextStep != null ? String(row.nextStep) : null,
    batchId: motorCasingId || procurementId || "—",
    batchType: String(row?.casingType ?? "—"),
    motorId: motorNo || motorStage || "—",
    motorType: motorStage,
    priority: "Medium",
    assignedTo:
      row?.createdBy && typeof row.createdBy === "object"
        ? { fullName: String((row.createdBy as { fullName?: string }).fullName ?? "") }
        : null,
    createdOn: String(row?.createdOn ?? ""),
    rmStatus,
    draftData: null,
    rejectionReason: null,
  };
}

export const useRocketMotorCasingList = () => {
  const user = useAuthStore((s) => s.user);
  const refreshVersion = useUserBatchRefreshStore((s) => s.version);

  const subDepartmentId = useMemo(
    () => user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "rocket-motor")?.subDepartmentId,
    [user]
  );

  const [batches, setBatches] = useState<RocketMotorBatch[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(STRINGS.USER_BATCH_LIST.FILTER_ALL);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const fetchBatches = useCallback(async () => {
    if (!subDepartmentId) {
      setLoading(false);
      setBatches([]);
      setTotalRecords(0);
      setStatusCounts({});
      return;
    }

    setLoading(true);
    try {
      const payload: Parameters<typeof rocketMotorCasingController.fetchCasingList>[0] = {
        subDepartmentId,
        page: page + 1,
        limit: rowsPerPage,
      };

      if (debouncedSearch.trim()) {
        payload.search = debouncedSearch.trim();
      }

      if (statusFilter !== STRINGS.USER_BATCH_LIST.FILTER_ALL) {
        const apiStatus = UI_STATUS_TO_API[statusFilter];
        if (apiStatus) {
          payload.status = [apiStatus];
        }
      }

      const res = await rocketMotorCasingController.fetchCasingList(payload);

      if (res?.success && res.data) {
        const data = res.data as {
          casings?: unknown[];
          statusCounts?: Record<string, number>;
          pagination?: { totalRecords?: number };
        };
        const rows = Array.isArray(data.casings) ? data.casings : [];
        setBatches(rows.map((r) => mapRocketMotorCasingListRow(r as Record<string, unknown>)));
        setStatusCounts(data.statusCounts ?? {});
        setTotalRecords(Number(data.pagination?.totalRecords ?? rows.length));
      } else {
        setBatches([]);
        setTotalRecords(0);
        setStatusCounts({});
      }
    } catch (e) {
      console.error("Rocket motor casing list fetch failed", e);
      setBatches([]);
      setTotalRecords(0);
      setStatusCounts({});
    } finally {
      setLoading(false);
    }
  }, [subDepartmentId, page, rowsPerPage, debouncedSearch, statusFilter, refreshVersion]);

  useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

  return {
    batches,
    statusCounts,
    loading,
    page,
    rowsPerPage,
    search,
    statusFilter,
    totalRecords,
    setPage,
    setRowsPerPage,
    setSearch,
    setStatusFilter,
    refreshUserBatches: fetchBatches,
  };
};
