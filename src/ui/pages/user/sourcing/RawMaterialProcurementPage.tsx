import { Box } from "@mui/material";
import { useMemo } from "react";
import ConfirmAlertDialog from "../../../components/common/ConfirmAlertDialog";
import { useThemeStore } from "../../../../app/store/themeStore";
import getSourcingTheme from "../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import useRawMaterialProcurementHook from "../../../../hooks/user/sourcing/useRawMaterialProcurementHook";
import UserWorkflowFormHeader from "../../../components/custom/UserWorkflowFormHeader";
import RawMaterialBatchList from "./components/RawMaterialBatchList";
import SpecificationFormBuilder from "./components/SpecificationFormBuilder";
import { STRINGS } from "../../../../app/config/strings";

const RawMaterialProcurement = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);

  const hookState = useRawMaterialProcurementHook();
  const {
    view,
    activeBatch,
    isEditMode,
    formEntryMode,
    formBlocks,
    loadingFormDetails,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    handleBlocksChange,
    handleDiscardAndBack,
    handleBack,
    handleSaveDraft,
    handleSubmit,
  } = hookState;

  const createLotHeaderHeading =
    !isEditMode && formEntryMode === "create"
      ? {
          title: STRINGS.SOURCING.RAW_MATERIAL.FORM_HEADER_CREATE_LOT_TITLE,
          subtitle: STRINGS.SOURCING.RAW_MATERIAL.FORM_HEADER_CREATE_LOT_SUBTITLE,
        }
      : undefined;

  return (
    <Box sx={theme.workflow.animatedContainer}>
      {view === "list" && (
        <RawMaterialBatchList hookState={hookState} />
      )}

      {view === "form" && activeBatch && (
        <Box>
          <UserWorkflowFormHeader
            batch={activeBatch}
            isEdit={isEditMode}
            onBack={handleBack}
            newLabel={STRINGS.SOURCING.RAW_MATERIAL.NEW_SUBMISSION}
            batchHeadingOverride={createLotHeaderHeading}
            theme={theme}
          />

          {!loadingFormDetails && (
            <SpecificationFormBuilder
              initialBlocks={formBlocks}
              isEditMode={isEditMode}
              createLotMode={formEntryMode === "create"}
              onBlocksChange={handleBlocksChange}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
              actionLoading={actionLoading}
            />
          )}
        </Box>
      )}

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={STRINGS.SOURCING.SPECIFICATION_FORM.UNSAVED_BACK_TITLE}
        message={STRINGS.SOURCING.SPECIFICATION_FORM.UNSAVED_BACK_MESSAGE}
        confirmLabel={STRINGS.SOURCING.SPECIFICATION_FORM.UNSAVED_BACK_DISCARD}
        cancelLabel={STRINGS.SOURCING.SPECIFICATION_FORM.UNSAVED_BACK_CONFIRM}
        onConfirm={handleDiscardAndBack}
        onCancel={() => setBackConfirmOpen(false)}
      />
    </Box>
  );
};

export default RawMaterialProcurement;
