import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, Stack,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Zoom,
} from "@mui/material";

import { icons }      from "../../../../../../app/theme";
import { STRINGS }    from "../../../../../../app/config/strings";
import Input          from "../../../../../components/common/Input";
import { priorityConfig } from "./BatchConfigs";

const S = STRINGS.BATCH_MANAGEMENT.FORM;

const BatchFormModal = ({
  open,
  onClose,
  onSave,
  editTarget,
  form,
  onFormChange,
  userOptions,
  saving,
  t,
}: any) => {
  const { modal, input } = t;

  const formValid =
    form.batchId && form.motorId && form.projectName && form.batchType && form.motorType;

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      TransitionComponent={Zoom}
      maxWidth={false}
      fullWidth
      PaperProps={{ sx: modal.paper }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={modal.header.wrapper}>
          <Box sx={modal.header.titleRow}>
            <Box sx={modal.header.iconBadge}>
              <icons.batchMgmt.batchIcon sx={modal.header.icon} />
            </Box>
            <Box>
              <Typography sx={modal.header.title}>
                {editTarget ? S.EDIT_TITLE : S.CREATE_TITLE}
              </Typography>
              <Typography sx={modal.header.subtitle}>
                {editTarget
                  ? S.EDIT_SUBTITLE(editTarget.batchId || editTarget.id)
                  : S.CREATE_SUBTITLE}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => !saving && onClose()} sx={modal.header.closeButton}>
            <icons.batchMgmt.close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        <Stack spacing={modal.stackSpacing}>

          {/* Identification */}
          <Box>
            <Typography sx={modal.fieldLabel}>{S.IDENTIFICATION_LABEL}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <Input
                fullWidth label={S.BATCH_ID_LABEL} value={form.batchId}
                onChange={onFormChange("batchId")} placeholder={S.BATCH_ID_PLACEHOLDER}
                size="small" sx={input} disabled={!!editTarget}
              />
              <Input
                fullWidth label={S.MOTOR_ID_LABEL} value={form.motorId}
                onChange={onFormChange("motorId")} placeholder={S.MOTOR_ID_PLACEHOLDER}
                size="small" sx={input}
              />
            </Stack>
          </Box>

          {/* Project */}
          <Box>
            <Typography sx={modal.fieldLabel}>{S.PROJECT_LABEL}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <Input
                fullWidth label={S.PROJECT_NAME_LABEL} value={form.projectName}
                onChange={onFormChange("projectName")} placeholder={S.PROJECT_NAME_PLACEHOLDER}
                size="small" sx={input}
              />
              <FormControl fullWidth size="small" sx={input}>
                <InputLabel>{S.BATCH_TYPE_LABEL}</InputLabel>
                <Select value={form.batchType} label={S.BATCH_TYPE_LABEL}
                  onChange={onFormChange("batchType")} MenuProps={t.menuPaper} disabled={!!editTarget}>
                  {S.BATCH_TYPES.map((bt: string) => (
                    <MenuItem key={bt} value={bt}>{bt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" sx={input}>
                <InputLabel>{S.MOTOR_TYPE_LABEL}</InputLabel>
                <Select value={form.motorType} label={S.MOTOR_TYPE_LABEL}
                  onChange={onFormChange("motorType")} MenuProps={t.menuPaper}>
                  {S.MOTOR_TYPES.map((mt: string) => (
                    <MenuItem key={mt} value={mt}>{mt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {/* Priority & Assignment */}
          <Box>
            <Typography sx={modal.fieldLabel}>{S.PRIORITY_ASSIGNMENT_LABEL}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <FormControl fullWidth size="small" sx={input}>
                <InputLabel>{S.PRIORITY_LABEL}</InputLabel>
                <Select value={form.priority} label={S.PRIORITY_LABEL}
                  onChange={onFormChange("priority")} MenuProps={t.menuPaper}>
                  {S.PRIORITIES.map((p: string) => {
                    const pc = priorityConfig[p];
                    return (
                      <MenuItem key={p} value={p}>
                        <Box sx={modal.menuItemRow}>
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: pc?.color, flexShrink: 0 }} />
                          {p}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={input}>
                <InputLabel>{S.ASSIGNED_TO_LABEL}</InputLabel>
                <Select value={form.assignedTo} label={S.ASSIGNED_TO_LABEL}
                  onChange={onFormChange("assignedTo")} MenuProps={t.menuPaper}>
                  <MenuItem value=""><em>{S.UNASSIGNED}</em></MenuItem>
                  {(userOptions || []).map((u: any) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.fullName || u.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>

        </Stack>
      </DialogContent>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <DialogActions sx={modal.actions}>
        <Button onClick={() => !saving && onClose()} sx={modal.cancelButton}>
          {S.CANCEL}
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={!formValid || saving}
          sx={modal.saveButton}
        >
          {saving ? (
            <><CircularProgress size={14} sx={modal.savingSpinner} />{S.SAVING}</>
          ) : editTarget ? S.SAVE_CHANGES : S.CREATE_BATCH}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchFormModal;