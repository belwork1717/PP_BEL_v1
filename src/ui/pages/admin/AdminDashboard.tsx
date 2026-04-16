import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import * as batchController from "../../../controllers/system_manager/batchController";
import AppHeader from "../../components/custom/AppHeader";
import DashboardPage from "./components/DashboardPage";
import { useAdminNavStore, ADMIN_VIEWS } from "../../../app/store/adminNavStore";
import { useThemeStore } from "../../../app/store/themeStore";
import getDashboardTheme from "../../../app/theme/custom_themes/admin/dashboard_theme";
import UserManagementPage from "./components/user_management/UserManagementPage";
import BatchManagementPage from "./components/batch_management/BatchManagementPage";

const AdminDashboard = ({ onLogout: _onLogout }: { onLogout?: () => void } = {}) => {
  const [batches, setBatches] = useState([]);
  const activeView = useAdminNavStore((s) => s.activeView);
  const mode = useThemeStore((s) => s.mode);
  const th = getDashboardTheme(mode);

  // useEffect(() => {
  //   batchController.getBatches().then(setBatches);
  // }, []);

  const renderView = () => {
    switch (activeView) {
      case ADMIN_VIEWS.DASHBOARD: return <DashboardPage mode={mode} />;
      case ADMIN_VIEWS.USERS: return <UserManagementPage mode={mode} />;
      case ADMIN_VIEWS.BATCH: return <BatchManagementPage mode={mode} />;
      default:                    return <DashboardPage mode={mode} />;
    }
  };

  return (
    <Box sx={th.dashboard.adminWrapper}>
      {renderView()}
    </Box>
  );
};

export default AdminDashboard;