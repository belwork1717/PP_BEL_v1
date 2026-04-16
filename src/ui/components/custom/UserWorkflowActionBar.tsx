import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

type UserWorkflowActionBarProps = {
  isEdit: boolean;
  canSubmit: boolean;
  readinessText: string;
  pendingText: string;
  helperText: string;
  onSaveDraft: () => void;
  onSubmitClick: () => void;
  theme: any;
  saveLabel?: string;
  submitLabel?: string;
  resubmitLabel?: string;
  saveTooltip?: string;
  disableActions?: boolean;
};

const UserWorkflowActionBar = ({
  isEdit,
  canSubmit,
  readinessText,
  pendingText,
  helperText,
  onSaveDraft,
  onSubmitClick,
  theme,
  saveLabel = "Save as Draft",
  submitLabel = "Submit for Approval",
  resubmitLabel = "Resubmit for Approval",
  saveTooltip = "Save progress and continue later",
  disableActions = false,
}: UserWorkflowActionBarProps) => {
  return (
    <Box sx={theme.workflow.actionBar.container}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={2}>
        <Box>
          <Typography sx={theme.workflow.actionBar.primaryText}>{canSubmit ? readinessText : pendingText}</Typography>
          <Typography sx={theme.workflow.actionBar.secondaryText}>{helperText}</Typography>
        </Box>

        <Stack direction="row" gap={1.5} flexShrink={0}>
          <Tooltip title={saveTooltip} arrow placement="top">
            <Button variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={onSaveDraft} disabled={disableActions} sx={theme.workflow.actionBar.saveButton}>
              {saveLabel}
            </Button>
          </Tooltip>

          <Tooltip title={!canSubmit ? pendingText : ""} arrow placement="top">
            <span>
              <Button
                variant="contained"
                startIcon={<SendRoundedIcon />}
                disabled={!canSubmit || disableActions}
                onClick={onSubmitClick}
                sx={theme.workflow.actionBar.submitButton}
              >
                {isEdit ? resubmitLabel : submitLabel}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
};

export default UserWorkflowActionBar;
