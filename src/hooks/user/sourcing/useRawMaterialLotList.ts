import { useState, useCallback, useEffect } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import rawMaterialProcurementController from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import { OPERATION_STATUS } from "../../operationStatus";
import { mapLotListApiRow, RawMaterialLotListRequest } from "../../../data/models/user/RawMaterialProcurementModel";

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
  const [statusFilter, setStatusFilter] = useState<string>(STRINGS.USER_BATCH_LIST.FILTER_ALL);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

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

      if (statusFilter !== STRINGS.USER_BATCH_LIST.FILTER_ALL) {
        payload.status = [statusFilter];
      }

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
  }, [subDepartmentId, page, rowsPerPage, debouncedSearch, statusFilter, refreshVersion]);

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
  };
};

export default useRawMaterialLotList;
