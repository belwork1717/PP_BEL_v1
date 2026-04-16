import React from "react";
import {
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  Box, Typography, Divider, Chip,
} from "@mui/material";

import { icons } from "../../../../../../app/theme/icons";
import { STRINGS } from "../../../../../../app/config/strings";

import UserAvatar  from "../../../../../components/common/UserAvatar";
import UserActions from "../../../../../components/common/UserActions";
import SkeletonRow from "../../../../../components/common/SkeletonRow";

import {
  stageConfig,
  statusConfig,
  priorityConfig,
  getDeptConfig,
  getBatchId,
  getMotorId,
  getMotorType,
  getStage,
  getStatus,
  getPriority,
  getDept,
  getSubDept,
  getAssignedTo,
  getNotes,
} from "./BatchConfigs";

const S = STRINGS.BATCH_MANAGEMENT;

const BatchListTable = ({
  paginated,
  filtered,
  loading,
  departments,
  page,
  totalCount,
  rowsPerPage,
  t,
  onEdit,
  onDelete,
  onPageChange,
  onRowsPerPageChange,
}: any) => {
  const { table, tableCell } = t;

  return (
    <Paper elevation={0} sx={table.paper}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {S.TABLE_COLS.map((h: string) => (
                <TableCell
                  key={h}
                  sx={{
                    ...table.headerCell,
                    ...(h === "Actions" && table.headerCellActions),
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, i) => (
                <SkeletonRow key={i} columns={S.TABLE_COLS.length} sx={table.cell} />
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={S.TABLE_COLS.length} sx={table.emptyCell}>
                  <icons.batchMgmt.emptyBatch sx={table.emptyIcon} />
                  <Typography sx={table.emptyText}>No batches found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((batch: any) => {
                const batchId    = getBatchId(batch);
                const motorId    = getMotorId(batch);
                const motorType  = getMotorType(batch);
                const stage      = getStage(batch);
                const status     = getStatus(batch);
                const priority   = getPriority(batch);
                const dept       = getDept(batch);
                const subDept    = getSubDept(batch);
                const assignedTo = getAssignedTo(batch);
                const dc         = getDeptConfig(dept, departments);
                const scStage    = stageConfig[stage];
                const scStatus   = statusConfig[status];
                const pc         = priorityConfig[priority];

                return (
                  <TableRow key={batch.id || batch.batchId} sx={table.row}>

                    {/* Batch ID */}
                    <TableCell sx={table.cell}>
                      <Box sx={tableCell.batchIdBox}>
                        <icons.batchMgmt.batchId sx={tableCell.batchIdIcon} />
                        <Typography sx={tableCell.batchIdText}>{batchId}</Typography>
                      </Box>
                    </TableCell>

                    {/* Motor ID */}
                    <TableCell sx={table.cell}>
                      <Box sx={tableCell.motorIdBox}>
                        <icons.batchMgmt.motorId sx={tableCell.motorIdIcon} />
                        <Typography sx={tableCell.motorIdText}>{motorId}</Typography>
                      </Box>
                    </TableCell>

                    {/* Motor Type */}
                    <TableCell sx={table.cell}>
                      <Box sx={tableCell.motorIdBox}>
                        <icons.batchMgmt.motorId sx={tableCell.motorIdIcon} />
                        <Typography sx={tableCell.motorIdText}>{motorType}</Typography>
                      </Box>
                    </TableCell>

                    {/* Stage (shows sub-dept chip) */}
                    <TableCell sx={table.cell}>
                      <Chip
                        icon={scStage ? <scStage.Icon /> : undefined}
                        label={subDept}
                        size="small"
                        sx={tableCell.stageChip(scStage)}
                      />
                    </TableCell>

                    {/* Status */}
                    <TableCell sx={table.cell}>
                      <Chip
                        icon={scStatus ? <scStatus.Icon /> : undefined}
                        label={status}
                        size="small"
                        sx={tableCell.statusChip(scStatus)}
                      />
                    </TableCell>

                    {/* Priority */}
                    <TableCell sx={table.cell}>
                      <Chip
                        label={priority}
                        size="small"
                        sx={tableCell.priorityChip(pc)}
                      />
                    </TableCell>

                    {/* Assigned To (System Manager) */}
                    <TableCell sx={table.cell}>
                      {assignedTo ? (
                        <Box sx={tableCell.assignedToBox}>
                          <UserAvatar
                            name={assignedTo.name || assignedTo.fullName || assignedTo.username || "?"}
                            sx={tableCell.assignedAvatar}
                          />
                          <Typography sx={tableCell.assignedName}>
                            {assignedTo.name || assignedTo.fullName || assignedTo.username}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography sx={tableCell.assignedEmpty}>Unassigned</Typography>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell sx={table.cellActionsWrapper}>
                      <UserActions
                        onEdit={() => onEdit(batch)}
                        onDelete={() => onDelete(batch)}
                      />
                    </TableCell>

                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={table.divider} />
      <TablePagination
        component="div"
        count={totalCount ?? (filtered?.length ?? 0)}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 8, 15, 25]}
        sx={table.pagination}
      />
    </Paper>
  );
};

export default BatchListTable;