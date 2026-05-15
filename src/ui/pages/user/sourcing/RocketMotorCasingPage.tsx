import { Box } from "@mui/material";
import { useMemo } from "react";
import ConfirmAlertDialog from "../../../components/common/ConfirmAlertDialog";
import { useThemeStore } from "../../../../app/store/themeStore";
import getSourcingTheme from "../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import useRocketMotorCasingHook from "../../../../hooks/user/sourcing/useRocketMotorCasingHook";
import UserWorkflowActionBar from "../../../components/custom/UserWorkflowActionBar";
import UserWorkflowFormHeader from "../../../components/custom/UserWorkflowFormHeader";
import CasingDetailsForm from "./components/CasingDetailsForm";
import RocketMotorBatchList from "./components/RocketMotorBatchList";
import { STRINGS } from "../../../../app/config/strings";

const RocketMotorCasing = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);

  const hookState = useRocketMotorCasingHook();
  const {
    view,
    activeBatch,
    isEditMode,
    formData,
    loadingFormDetails,
    actionLoading,
    dimensionalParameters,
    dimensionalParametersErrorMessage,
    isDimensionalParamsLoading,
    backConfirmOpen,
    submitConfirm,
    draftConfirm,
    setBackConfirmOpen,
    setSubmitConfirm,
    setDraftConfirm,
    handleChange,
    handleMediaChange,
    handleDimChange,
    handleBack,
    handleDiscardAndBack,
    handleConfirmDraft,
    handleConfirmSubmit,
  } = hookState;

  return (
    <Box sx={theme.workflow.animatedContainer}>
      {view === "list" && (
        <RocketMotorBatchList
          hookState={hookState}
          rowsPerPageOptions={[5, 10, 25]}
        />
      )}

      {view === "form" && activeBatch && (
        <Box>
          <UserWorkflowFormHeader
            batch={activeBatch}
            isEdit={isEditMode}
            onBack={handleBack}
            newLabel={activeBatch.rmStatus === "In Progress" ? STRINGS.SOURCING.CASING.CONTINUING_DRAFT : STRINGS.SOURCING.CASING.NEW_SUBMISSION}
            includeMotorType
            theme={theme}
          />

          {!loadingFormDetails && !isDimensionalParamsLoading(activeBatch.motorType || "") && (
            <>
              <CasingDetailsForm
                formData={formData}
                onChange={handleChange}
                onMediaChange={handleMediaChange}
                onDimChange={handleDimChange}
                dimensionalParameters={dimensionalParameters}
                dimensionalParametersErrorMessage={dimensionalParametersErrorMessage}
                motorType={activeBatch.motorType}
                isEditMode={isEditMode}
              />

              <UserWorkflowActionBar
                isEdit={isEditMode}
                canSubmit={Boolean(
                  String(formData.motorCasingId ?? "").trim() &&
                    String(formData.motorStageApi || activeBatch.motorStage || "").trim() &&
                    String(formData.motorNoApi || activeBatch.motorNo || "").trim() &&
                    String(formData.itemsDescription ?? "").trim()
                )}
                readinessText={STRINGS.SOURCING.CASING_FORM.READY_TO_SUBMIT}
                pendingText={STRINGS.SOURCING.CASING_FORM.NOT_READY_TO_SUBMIT}
                helperText={STRINGS.SOURCING.CASING_FORM.ACTION_HELPER}
                saveLabel={STRINGS.SOURCING.CASING_FORM.SAVE_DRAFT}
                submitLabel={STRINGS.SOURCING.CASING_FORM.SUBMIT_APPROVAL}
                resubmitLabel={STRINGS.SOURCING.CASING_FORM.RESUBMIT_APPROVAL}
                saveTooltip={STRINGS.SOURCING.CASING_FORM.SAVE_TOOLTIP}
                disableActions={actionLoading}
                onSaveDraft={() => setDraftConfirm(true)}
                onSubmitClick={() => setSubmitConfirm(true)}
                theme={theme}
              />
            </>
          )}
        </Box>
      )}

      <ConfirmAlertDialog
        open={draftConfirm}
        severity="info"
        title={STRINGS.SOURCING.CASING_FORM.CONFIRM_DRAFT_TITLE}
        message={STRINGS.SOURCING.CASING_FORM.CONFIRM_DRAFT_MESSAGE}
        confirmLabel={STRINGS.SOURCING.CASING_FORM.CONFIRM_DRAFT_ACTION}
        cancelLabel={STRINGS.SOURCING.CASING_FORM.CONFIRM_DRAFT_CANCEL_ACTION}
        onConfirm={handleConfirmDraft}
        onCancel={() => setDraftConfirm(false)}
      />

      <ConfirmAlertDialog
        open={submitConfirm}
        severity="warning"
        title={isEditMode ? STRINGS.SOURCING.CASING_FORM.CONFIRM_RESUBMIT_TITLE : STRINGS.SOURCING.CASING_FORM.CONFIRM_SUBMIT_TITLE}
        message={
          isEditMode
            ? STRINGS.SOURCING.CASING_FORM.CONFIRM_RESUBMIT_MESSAGE
            : STRINGS.SOURCING.CASING_FORM.CONFIRM_SUBMIT_MESSAGE
        }
        confirmLabel={isEditMode ? STRINGS.SOURCING.CASING_FORM.CONFIRM_RESUBMIT_ACTION : STRINGS.SOURCING.CASING_FORM.CONFIRM_SUBMIT_ACTION}
        cancelLabel={STRINGS.SOURCING.CASING_FORM.CONFIRM_CANCEL_ACTION}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setSubmitConfirm(false)}
      />

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={STRINGS.SOURCING.CASING_FORM.UNSAVED_BACK_TITLE}
        message={STRINGS.SOURCING.CASING_FORM.UNSAVED_BACK_MESSAGE}
        confirmLabel={STRINGS.SOURCING.CASING_FORM.UNSAVED_BACK_DISCARD}
        cancelLabel={STRINGS.SOURCING.CASING_FORM.UNSAVED_BACK_CONFIRM}
        onConfirm={handleDiscardAndBack}
        onCancel={() => setBackConfirmOpen(false)}
      />
    </Box>
  );
};

export default RocketMotorCasing;
