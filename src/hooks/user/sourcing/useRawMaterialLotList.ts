import { useState, useCallback, useEffect, useMemo } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { operationsController } from "../../../controllers/user/operationsController";
import rawMaterialProcurementController from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import { OPERATION_STATUS } from "../../operationStatus";
import { mapLotListApiRow, RawMaterialLotListRequest } from "../../../data/models/user/RawMaterialProcurementModel";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;

export type SubdeptMaterialOption = {
  materialCode: string;
  materialName: string;
};

export type RawMaterialLotListAdvancedFilters = {
  materialCodes: string[];
  manufacturer: string;
  fromDate: string;
  toDate: string;
};

const emptyAdvanced: RawMaterialLotListAdvancedFilters = {
  materialCodes: [],
  manufacturer: "",
  fromDate: "",
  toDate: "",
};

const normalizeMaterialsList = (data: unknown): SubdeptMaterialOption[] => {
  const raw = Array.isArray(data) ? data : (data as { materials?: unknown[]; items?: unknown[] })?.materials ?? (data as { items?: unknown[] })?.items ?? [];
  return raw
    .map((m: Record<string, unknown>) => ({
      materialCode: String(m?.materialCode ?? m?.code ?? ""),
      materialName: String(m?.materialName ?? m?.name ?? ""),
    }))
    .filter((m) => m.materialCode);
};

const mapLotListStatusCountsForUi = (
  server: Record<string, number> | undefined,
  totalRecords: number
): Record<string, number> => {
  const S = OPERATION_STATUS;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = server?.[k];
      if (typeof v === "number") return v;
    }
    return 0;
  };

  const byLabel: Record<string, number> = {
    [S.INITIATED]: pick("initiated", "Initiated"),
    [S.IN_PROGRESS]: pick("inProgress", "inProgress", "In Progress"),
    [S.WAITING_FOR_APPROVAL]: pick("waitingForApproval", "waitingforApproval", "Waiting for Approval"),
    [S.APPROVED]: pick("approved", "Approved"),
    [S.REJECTED]: pick("rejected", "Rejected"),
  };

  const sum = Object.values(byLabel).reduce((a, b) => a + b, 0);
  const allKey = STRINGS.USER_BATCH_LIST.FILTER_ALL;
  return {
    ...byLabel,
    [allKey]: sum > 0 ? sum : totalRecords,
  };
};

export const useRawMaterialLotList = () => {
  const user = useAuthStore((s) => s.user);
  const refreshVersion = useUserBatchRefreshStore((state) => state.version);

  const subDepartmentId = user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "raw-material")?.subDepartmentId;

  const [batches, setBatches] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilterState] = useState<string>(FILTER_ALL);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [advancedFilters, setAdvancedFilters] = useState<RawMaterialLotListAdvancedFilters>(emptyAdvanced);
  const [materialOptions, setMaterialOptions] = useState<SubdeptMaterialOption[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterState(value);
    setPage(0);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    let active = true;
    const loadMaterials = async () => {
      if (!subDepartmentId) {
        setMaterialOptions([]);
        return;
      }
      setMaterialsLoading(true);
      try {
        const res = await operationsController.fetchMaterialsList();
        if (!active) return;
        if (res?.success && res.data != null) {
          setMaterialOptions(normalizeMaterialsList(res.data));
        } else {
          setMaterialOptions([]);
        }
      } catch {
        if (active) setMaterialOptions([]);
      } finally {
        if (active) setMaterialsLoading(false);
      }
    };
    void loadMaterials();
    return () => {
      active = false;
    };
  }, [subDepartmentId]);

  const applyAdvancedFilters = useCallback((next: RawMaterialLotListAdvancedFilters & { status: string }) => {
    setAdvancedFilters({
      materialCodes: [...next.materialCodes],
      manufacturer: next.manufacturer,
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
    if (advancedFilters.materialCodes.length) n += 1;
    if (advancedFilters.manufacturer.trim()) n += 1;
    if (advancedFilters.fromDate) n += 1;
    if (advancedFilters.toDate) n += 1;
    if (statusFilter !== FILTER_ALL) n += 1;
    return n;
  }, [advancedFilters, statusFilter]);

  const fetchLots = useCallback(async () => {
    if (!subDepartmentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const payload: RawMaterialLotListRequest = {
        subDepartmentId,
        page: page + 1,
        limit: rowsPerPage,
      };

      if (debouncedSearch.trim()) {
        payload.search = debouncedSearch.trim();
      }

      if (statusFilter !== FILTER_ALL) {
        payload.status = [statusFilter];
      }

      if (advancedFilters.materialCodes.length) {
        payload.materialCode = advancedFilters.materialCodes;
      }
      if (advancedFilters.manufacturer.trim()) {
        payload.manufacturerName = advancedFilters.manufacturer.trim();
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

      const res = await rawMaterialProcurementController.fetchLotList(payload);

      if (res?.success && res.data) {
        const data = res.data as {
          lots?: unknown[];
          statusCounts?: Record<string, number>;
          pagination?: { totalRecords?: number };
        };
        const lots = (data.lots ?? []).map((lot, idx) => mapLotListApiRow(lot, idx));
        setBatches(lots);
        setStatusCounts(mapLotListStatusCountsForUi(data.statusCounts, data.pagination?.totalRecords ?? 0));
        setTotalRecords(data.pagination?.totalRecords ?? 0);
      } else {
        setBatches([]);
        setTotalRecords(0);
        setStatusCounts({});
      }
    } catch (error) {
      console.error("Error fetching raw material lots:", error);
    } finally {
      setLoading(false);
    }
  }, [
    subDepartmentId,
    page,
    rowsPerPage,
    debouncedSearch,
    statusFilter,
    advancedFilters,
    refreshVersion,
  ]);

  useEffect(() => {
    void fetchLots();
  }, [fetchLots]);

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
    refreshUserBatches: fetchLots,
    materialOptions,
    materialsLoading,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    activeFilterCount,
  };
};

export default useRawMaterialLotList;
