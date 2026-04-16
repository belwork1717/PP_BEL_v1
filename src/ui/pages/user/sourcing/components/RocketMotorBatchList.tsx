import React, { useMemo } from "react";
import { Chip, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import IconText from "../../../../components/common/IconText";
import UserBatchList from "../../../../components/custom/UserBatchList";
import UserWorkflowStatusAction from "../../../../components/custom/UserWorkflowStatusAction";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getSourcingTheme from "../../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import { STRINGS } from "../../../../../app/config/strings";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  person: PersonRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
} = icons.user.sourcing.rocketMotorBatchList;

export const OPERATION_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const RocketMotorBatchList = ({ hookState, rowsPerPageOptions }: any) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);

  const {
    batches,
    statusCounts,
    totalRecords,
    page,
    rowsPerPage,
    search,
    statusFilter,
    setPage,
    setRowsPerPage,
    setSearch,
    setStatusFilter,
    loading,
    handleFillForm,
    handleEditForm,
  } = hookState;

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(OPERATION_STATUS_CONFIG).map(([status, cfg]) => [status, { ...cfg, ...theme.batchList.statusConfig[status] }]),
      ),
    [theme],
  );

  const COLUMNS = useMemo(
    () => [
      {
        key: "batchId",
        label: STRINGS.SOURCING.BATCH_LIST.COL_BATCH_ID,
        render: (v: string) => <Typography sx={theme.batchList.batchIdText}>{v}</Typography>,
      },
      {
        key: "batchType",
        label: STRINGS.SOURCING.BATCH_LIST.COL_BATCH_TYPE,
        align: "center",
        render: (v: string) => <Chip label={v} size="small" sx={theme.batchList.batchTypeChip} />,
      },
      {
        key: "motorId",
        label: STRINGS.SOURCING.BATCH_LIST.COL_MOTOR_ID,
        render: (v: string) => <Typography sx={theme.batchList.normalText}>{v}</Typography>,
      },
      {
        key: "motorType",
        label: STRINGS.SOURCING.BATCH_LIST.COL_MOTOR_TYPE,
        align: "center",
        render: (v: string) => <Chip label={`${STRINGS.SOURCING.BATCH_LIST.MOTOR_TYPE_PREFIX}${v}`} size="small" sx={theme.batchList.batchTypeChip} />,
      },
      {
        key: "assignedTo.fullName",
        label: STRINGS.SOURCING.BATCH_LIST.COL_MANAGER,
        render: (v: string) => (
          <IconText
            icon={<PersonRoundedIcon sx={theme.batchList.icon} />}
            text={v ?? STRINGS.SOURCING.BATCH_LIST.UNASSIGNED}
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "createdOn",
        label: STRINGS.SOURCING.BATCH_LIST.COL_CREATED_ON,
        render: (v: string) => (
          <IconText
            icon={<CalendarMonthRoundedIcon sx={theme.batchList.icon} />}
            text={new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "priority",
        label: STRINGS.SOURCING.BATCH_LIST.COL_PRIORITY,
        align: "center",
        render: (v: string) => {
          const cfg = theme.batchList.priorityConfig[v] ?? theme.batchList.priorityConfig.Medium;
          return <Chip label={v} size="small" sx={{ height: 22, fontSize: "0.68rem", fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }} />;
        },
      },
      {
        key: "rmStatus",
        label: "Operation Status",
        align: "center",
        render: (v: string, row: any) => (
          <UserWorkflowStatusCell
            status={v}
            statusConfig={statusConfig}
            rejectedStatus={OPERATION_STATUS.REJECTED}
            rejectionReason={row.rejectionReason}
            theme={theme}
          />
        ),
      },
    ],
    [statusConfig, theme],
  );

  return (
    <UserBatchList
      rows={batches}
      columns={COLUMNS}
      statusField="rmStatus"
      statusConfig={statusConfig}
      filters={[{ field: "priority", options: ["Critical", "High", "Medium", "Low"] }]}
      searchFields={["batchId", "motorId"]}
      highlightRow={(row: any) => row.rmStatus === OPERATION_STATUS.REJECTED}
      highlightColor={theme.palette.danger}
      rowsPerPageOptions={rowsPerPageOptions}
      tableLabel={STRINGS.SOURCING.BATCH_LIST.MOTOR_TITLE}
      themeTokens={theme}
      
      // Hook up generic hook logic explicitly
      totalRecords={totalRecords}
      statusCounts={statusCounts}
      page={page}
      rowsPerPage={rowsPerPage}
      search={search}
      statusFilter={statusFilter}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
      onSearchChange={setSearch}
      onStatusFilterChange={setStatusFilter}
      isLoading={loading}

      renderAction={(row: any) => {
        return (
          <UserWorkflowStatusAction
            status={row.rmStatus}
            row={row}
            statusMap={OPERATION_STATUS}
            onFillForm={handleFillForm}
            onEditForm={handleEditForm}
            theme={theme}
            fillLabel={STRINGS.SOURCING.BATCH_LIST.FILL_ACTION}
            continueLabel={STRINGS.SOURCING.BATCH_LIST.CONTINUE_ACTION}
            editTooltip={STRINGS.SOURCING.BATCH_LIST.EDIT_ACTION_TOOLTIP}
          />
        );
      }}
    />
  );
};

export default RocketMotorBatchList;
