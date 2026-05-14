import React, { useMemo } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
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
} = icons.user.sourcing.rawMaterialBatchList;

export const OPERATION_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const canShowEditButton = (status: string) =>
  status === OPERATION_STATUS.INITIATED || status === OPERATION_STATUS.IN_PROGRESS;

const RawMaterialBatchList = ({ hookState, rowsPerPageOptions }: any) => {
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
    handleEditLot,
    handleCreateLot,
  } = hookState;

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(OPERATION_STATUS_CONFIG).map(([status, cfg]) => [status, { ...cfg, ...theme.batchList.statusConfig[status] }])
      ),
    [theme]
  );

  const COLUMNS = useMemo(
    () => [
      {
        key: "lotId",
        label: STRINGS.SOURCING.BATCH_LIST.COL_LOT_ID,
        render: (v: string) => <Typography sx={theme.batchList.batchIdText}>{v}</Typography>,
      },
      {
        key: "procurementId",
        label: STRINGS.SOURCING.BATCH_LIST.COL_PROCUREMENT_ID,
        render: (v: string) => <Typography sx={theme.batchList.normalText}>{v}</Typography>,
      },
      {
        key: "materialCode",
        label: STRINGS.SOURCING.BATCH_LIST.COL_MATERIAL_CODE,
        align: "center",
        render: (v: string) => <Chip label={v} size="small" sx={theme.batchList.batchTypeChip} />,
      },
      {
        key: "materialName",
        label: STRINGS.SOURCING.BATCH_LIST.COL_MATERIAL_NAME,
        render: (v: string) => <Typography sx={theme.batchList.normalText}>{v}</Typography>,
      },
      {
        key: "supplyOrderNo",
        label: STRINGS.SOURCING.BATCH_LIST.COL_SUPPLY_ORDER,
        render: (v: string) => <Typography sx={theme.batchList.subtleText}>{v}</Typography>,
      },
      {
        key: "receiptDate",
        label: STRINGS.SOURCING.BATCH_LIST.COL_RECEIPT_DATE,
        render: (v: string) => (
          <IconText
            icon={<CalendarMonthRoundedIcon sx={theme.batchList.icon} />}
            text={v || "—"}
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "manufacturerName",
        label: STRINGS.SOURCING.BATCH_LIST.COL_MANUFACTURER,
        render: (v: string) => <Typography sx={theme.batchList.subtleText}>{v}</Typography>,
      },
      {
        key: "createdBy.fullName",
        label: STRINGS.SOURCING.BATCH_LIST.COL_CREATED_BY,
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
            text={v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            textSx={theme.batchList.subtleText}
          />
        ),
      },
      {
        key: "rmStatus",
        label: STRINGS.SOURCING.BATCH_LIST.COL_RM_STATUS,
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
    [statusConfig, theme]
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 2 }}>
        <Button variant="contained" size="medium" onClick={handleCreateLot} sx={{ textTransform: "none", fontWeight: 700 }}>
          {STRINGS.SOURCING.BATCH_LIST.CREATE_LOT}
        </Button>
      </Stack>

      <UserBatchList
        rows={batches}
        columns={COLUMNS}
        statusField="rmStatus"
        statusConfig={statusConfig}
        filters={[]}
        searchFields={["lotId", "procurementId", "materialCode", "materialName", "manufacturerName", "supplyOrderNo"]}
        highlightRow={(row: any) => row.rmStatus === OPERATION_STATUS.REJECTED}
        highlightColor={theme.palette.danger}
        rowsPerPageOptions={rowsPerPageOptions}
        tableLabel={STRINGS.SOURCING.BATCH_LIST.RM_TITLE}
        themeTokens={theme}
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
        renderAction={(row: any) => (
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" flexWrap="wrap">
            <UserWorkflowStatusAction
              status={row.rmStatus}
              row={row}
              statusMap={OPERATION_STATUS}
              onFillForm={handleFillForm}
              onEditForm={handleEditLot}
              theme={theme}
              fillLabel={STRINGS.SOURCING.BATCH_LIST.FILL_ACTION}
              continueLabel={STRINGS.SOURCING.BATCH_LIST.CONTINUE_ACTION}
              editTooltip={STRINGS.SOURCING.BATCH_LIST.EDIT_ACTION_TOOLTIP}
            />
            {canShowEditButton(row.rmStatus) && (
              <Button variant="outlined" size="small" onClick={() => handleEditLot(row)} sx={theme.batchList.action.secondary}>
                {STRINGS.SOURCING.BATCH_LIST.EDIT_LOT}
              </Button>
            )}
          </Stack>
        )}
      />
    </Box>
  );
};

export default RawMaterialBatchList;
