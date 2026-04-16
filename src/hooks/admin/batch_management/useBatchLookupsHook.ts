import { useState, useCallback, useEffect } from "react";
import { generalController } from "../../../controllers/admin/common/generalController";
import { userManagementController } from "../../../controllers/admin/user_management/userManagementController";
import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.BATCH_MANAGEMENT;

export const useBatchLookups = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepts, setSubDepts]       = useState<any[]>([]);
  const [users, setUsers]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  const loadLookups = useCallback(async () => {
    setLoading(true);
    try {
      const [deptResp, subDeptResp, userResp] = await Promise.all([
        generalController.getDepartments(),
        generalController.getSubDepartments(),
        userManagementController.getAllUsers({
          search: "",
          role: "System Manager",
          department: "All",
          status: "Active",
          page: 1,
          pageSize: 1000,
        }),
      ]);

      setDepartments(deptResp?.data || []);
      setSubDepts(subDeptResp?.data || []);

      // getAllUsers returns ApiResponseModel<{users, pagination}>
      if (userResp?.success && userResp.data) {
        const rawUsers = Array.isArray(userResp.data)
          ? userResp.data
          : (userResp.data as any).users || [];
        setUsers(rawUsers);
      }
    } catch (err) {
      console.error(S.ERRORS.LOAD_LOOKUPS_FAILED, err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLookups(); }, [loadLookups]);

  const deptNames = departments.map((d: any) => d.departmentName || d.name).filter(Boolean);

  const userOptions = users.map((u: any) => ({
    id:       u.userId || u.userUUID || u.id,
    userUUID: u.userUUID || u.id || "",
    fullName: u.username || u.fullName || u.name,
    name:     u.username || u.fullName || u.name || "",
    username: u.username,
  }));

  return {
    departments,
    subDepts,
    users,
    userOptions,
    deptNames,
    loading,
    loadLookups,
  };
};
