import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { STRINGS } from "../../../app/config/strings";
import { operationsController } from "../../../controllers/user/operationsController";
import rocketMotorCasingController from "../../../controllers/user/sourcing/rocketMotorCasingController";
import { normalizeRocketCasingListStatus } from "../../../data/models/user/RocketMotorCasingProcurementModel";
import { OPERATION_STATUS } from "../../operationStatus";
import type { RocketMotorBatch } from "./sourcingWorkflowData";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;

const UI_STATUS_TO_API: Record<string, string> = {
  [OPERATION_STATUS.INITIATED]: "INITIATED",
  [OPERATION_STATUS.IN_PROGRESS]: "IN_PROGRESS",
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: "WAITING_FOR_APPROVAL",
  [OPERATION_STATUS.APPROVED]: "APPROVED",
  [OPERATION_STATUS.REJECTED]: "REJECTED",
};

export type MotorStageOption = { motorStage: string; noOfmotors: number };

export type RocketMotorCasingListAdvancedFilters = {
  motorStages: string[];
  casingTypes: string[];
  insulationTypes: string[];
  fromDate: string;
  toDate: string;
};

const emptyAdvanced: RocketMotorCasingListAdvancedFilters = {
  motorStages: [],
  casingTypes: [],
  insulationTypes: [],
  fromDate: "",
  toDate: "",
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

const mapStatusCountsForUi = (server: Record<string, number> | undefined, totalRecords: number) => {
  const S = OPERATION_STATUS;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = server?.[k];
      if (typeof v === "number") return v;
    }
    return 0;
  };

  const byLabel: Record<string, number> = {
    [S.INITIATED]: pick("initiated", "Initiated", "INITIATED"),
    [S.IN_PROGRESS]: pick("inProgress", "inProgress", "In Progress", "IN_PROGRESS"),
    [S.WAITING_FOR_APPROVAL]: pick("waitingForApproval", "waitingforApproval", "Waiting for Approval", "WAITING_FOR_APPROVAL"),
    [S.APPROVED]: pick("approved", "Approved", "APPROVED"),
    [S.REJECTED]: pick("rejected", "Rejected", "REJECTED"),
  };

  const sum = Object.values(byLabel).reduce((a, b) => a + b, 0);
  return {
    ...byLabel,
    [FILTER_ALL]: sum > 0 ? sum : totalRecords,
  };
};

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
  const [statusFilter, setStatusFilterState] = useState<string>(FILTER_ALL);
  const [totalRecords, setTotalRecords] = useState(0);
  const [advancedFilters, setAdvancedFilters] = useState<RocketMotorCasingListAdvancedFilters>(emptyAdvanced);
  const [motorStageOptions, setMotorStageOptions] = useState<MotorStageOption[]>([]);
  const [motorStagesLoading, setMotorStagesLoading] = useState(false);

  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterState(value);
    setPage(0);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let active = true;
    const loadStages = async () => {
      if (!subDepartmentId) {
        setMotorStageOptions([]);
        return;
      }
      setMotorStagesLoading(true);
      try {
        const res = await operationsController.fetchMotorsStageList();
        if (!active) return;
        if (res?.success && res.data) {
          setMotorStageOptions(
            (res.data.stages ?? []).map((s: { motorStage?: string; noOfmotors?: number }) => ({
              motorStage: String(s.motorStage ?? ""),
              noOfmotors: Number(s.noOfmotors ?? 0),
            }))
          );
        } else {
          setMotorStageOptions([]);
        }
      } catch {
        if (active) setMotorStageOptions([]);
      } finally {
        if (active) setMotorStagesLoading(false);
      }
    };
    void loadStages();
    return () => {
      active = false;
    };
  }, [subDepartmentId]);

  const applyAdvancedFilters = useCallback((next: RocketMotorCasingListAdvancedFilters & { status: string }) => {
    setAdvancedFilters({
      motorStages: [...next.motorStages],
      casingTypes: [...next.casingTypes],
      insulationTypes: [...next.insulationTypes],
      fromDate: next.fromDate,
      toDate: next.toDate,
    });
    setStatusFilterState(next.status);
    setPage(0);
  }, []);

  const clearAdvancedFilters = useCallback(() => {
    setAdvancedFilters(emptyAdvanced);
    setStatusFilterState(FILTER_ALL);
    setPage(0);
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (advancedFilters.motorStages.length) n += 1;
    if (advancedFilters.casingTypes.length) n += 1;
    if (advancedFilters.insulationTypes.length) n += 1;
    if (advancedFilters.fromDate) n += 1;
    if (advancedFilters.toDate) n += 1;
    if (statusFilter !== FILTER_ALL) n += 1;
    return n;
  }, [advancedFilters, statusFilter]);

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

      if (statusFilter !== FILTER_ALL) {
        const apiStatus = UI_STATUS_TO_API[statusFilter];
        if (apiStatus) {
          payload.status = [apiStatus];
        }
      }

      if (advancedFilters.motorStages.length) {
        payload.motorStage = advancedFilters.motorStages;
      }
      if (advancedFilters.casingTypes.length) {
        payload.casingType = advancedFilters.casingTypes;
      }
      if (advancedFilters.insulationTypes.length) {
        payload.insulationType = advancedFilters.insulationTypes;
      }

      let from = advancedFilters.fromDate;
      let to = advancedFilters.toDate;
      if (from && to && from > to) {
        const swap = from;
        from = to;
        to = swap;
      }
      if (from) payload.fromDate = from;
      if (to) payload.toDate = to;

      const res = await rocketMotorCasingController.fetchCasingList(payload);

      if (res?.success && res.data) {
        const data = res.data as {
          casings?: unknown[];
          statusCounts?: Record<string, number>;
          pagination?: { totalRecords?: number };
        };
        const rows = Array.isArray(data.casings) ? data.casings : [];
        const total = Number(data.pagination?.totalRecords ?? rows.length);
        setBatches(rows.map((r) => mapRocketMotorCasingListRow(r as Record<string, unknown>)));
        setStatusCounts(mapStatusCountsForUi(data.statusCounts, total));
        setTotalRecords(total);
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
  }, [subDepartmentId, page, rowsPerPage, debouncedSearch, statusFilter, advancedFilters, refreshVersion]);

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
    motorStageOptions,
    motorStagesLoading,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    activeFilterCount,
  };
};
