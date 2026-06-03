import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../../app/store/authStore";
import { rawMaterialProcurementController } from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import { rocketMotorCasingController } from "../../../controllers/user/sourcing/rocketMotorCasingController";
import {
  UserSubDepartmentDashboardStatsModel,
  type UserSubDepartmentDashboardStats,
} from "../../../data/models/user/UserSubDepartmentDashboardStatsModel";
import {
  RawMaterialProcurementStatsModel,
  type DepartmentHeaderStatItem,
} from "../../../data/models/user/RawMaterialProcurementStatsModel";

export const useSourcingDepartmentHeaderHook = (subDeptSlug: string) => {
  const user = useAuthStore((state) => state.user);
  const subDepartmentId = user?.allSubDepartments.find(
    (sd) => sd.slugs?.subDept === subDeptSlug
  )?.subDepartmentId;
  const [rawMaterialStats, setRawMaterialStats] = useState(
    RawMaterialProcurementStatsModel.empty()
  );
  const [defaultStats, setDefaultStats] = useState<UserSubDepartmentDashboardStats>(
    UserSubDepartmentDashboardStatsModel.empty()
  );

  const userName = user?.username || String(user?.userId || "User");
  const userRole = user?.role ? user.role.replace(/_/g, " ") : "User";

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      if (subDeptSlug === "raw-material") {
        if (!subDepartmentId) {
          if (!cancelled) setRawMaterialStats(RawMaterialProcurementStatsModel.empty());
          return;
        }
        const response = await rawMaterialProcurementController.fetchStats(subDepartmentId);
        if (!cancelled) {
          setRawMaterialStats(response?.data ?? RawMaterialProcurementStatsModel.empty());
        }
        return;
      }

      if (subDeptSlug === "rocket-motor") {
        if (!subDepartmentId) {
          if (!cancelled) setDefaultStats(UserSubDepartmentDashboardStatsModel.empty());
          return;
        }
        const response = await rocketMotorCasingController.fetchStats(subDepartmentId);
        if (!cancelled) {
          setDefaultStats(response?.data ?? UserSubDepartmentDashboardStatsModel.empty());
        }
        return;
      }

      if (!cancelled) {
        setRawMaterialStats(RawMaterialProcurementStatsModel.empty());
        setDefaultStats(UserSubDepartmentDashboardStatsModel.empty());
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [subDeptSlug, subDepartmentId]);

  const statItems: DepartmentHeaderStatItem[] | undefined = useMemo(() => {
    if (subDeptSlug === "raw-material") {
      return RawMaterialProcurementStatsModel.toStatItems(rawMaterialStats);
    }
    return undefined;
  }, [subDeptSlug, rawMaterialStats]);

  const stats = subDeptSlug === "rocket-motor" ? defaultStats : UserSubDepartmentDashboardStatsModel.empty();

  return {
    userName,
    userRole,
    stats,
    statItems,
  };
};

export default useSourcingDepartmentHeaderHook;
