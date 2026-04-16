import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import rawMaterialProcurementController from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import {
  mapBlocksToMaterialsPayload,
  RawMaterialProcurementDetailsModel,
} from "../../../data/models/user/RawMaterialProcurementModel";
import {
  MaterialBlock,
  RawMaterialBatch,
  SOURCING_STATUS,
} from "./sourcingWorkflowData";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";

type WorkflowView = "list" | "form";

export const useRawMaterialProcurementHook = () => {
  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<RawMaterialBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formBlocks, setFormBlocks] = useState<MaterialBlock[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState("[]");
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  
  // Mapping API subdepartment dynamically via user routing slug
  const listParams = useSubdepartmentBatches("raw-material");
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "raw-material")
        ?.subDepartmentId,
    [user]
  );

  const isFormDirty = useMemo(
    () => JSON.stringify(formBlocks) !== initialSnapshot,
    [formBlocks, initialSnapshot]
  );

  const resetFormContext = () => {
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setFormBlocks([]);
    setInitialSnapshot("[]");
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
  };

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const openFormWithResolvedData = async (batch: RawMaterialBatch, editMode: boolean) => {
    const shouldFetchDetails =
      editMode ||
      batch.rmStatus === SOURCING_STATUS.IN_PROGRESS ||
      batch.rmStatus === SOURCING_STATUS.REJECTED;

    let resolvedBlocks = batch.draftData ?? [];
    let resolvedFormId = batch.formId ?? null;

    if (shouldFetchDetails) {
      if (!subDepartmentId) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SUB_DEPARTMENT_MISSING, "error");
        return;
      }

      if (!resolvedFormId) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.FORM_ID_MISSING, "error");
        return;
      }

      setLoadingFormDetails(true);
      const detailsResponse = await rawMaterialProcurementController.fetchFormDetails({
        formId: resolvedFormId,
        subDepartmentId,
      });
      setLoadingFormDetails(false);

      if (!detailsResponse?.success || !detailsResponse.data) {
        const fallback =
          detailsResponse?.statusCode === 404
            ? STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_NOT_FOUND
            : STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_FETCH_ERROR;
        showAlert(getErrorMessage(detailsResponse, fallback), "error");
        return;
      }

      resolvedBlocks = RawMaterialProcurementDetailsModel.toMaterialBlocks(detailsResponse.data);
      resolvedFormId = detailsResponse.data.formId || resolvedFormId;
    }

    const openedBatch: RawMaterialBatch = {
      ...batch,
      formId: resolvedFormId,
      draftData: resolvedBlocks,
    };

    setActiveBatch(openedBatch);
    setFormBlocks(resolvedBlocks);
    setInitialSnapshot(JSON.stringify(resolvedBlocks));
    setIsEditMode(editMode);
    setView("form");
  };

  const handleFillForm = async (batch: RawMaterialBatch) => {
    await openFormWithResolvedData(batch, false);
  };

  const handleEditForm = async (batch: RawMaterialBatch) => {
    await openFormWithResolvedData(batch, true);
  };

  const handleBlocksChange = useCallback((blocks: MaterialBlock[]) => {
    const nextBlocks = blocks ?? [];
    setFormBlocks((prev) => (prev === nextBlocks ? prev : nextBlocks));
  }, []);

  const handleBack = () => {
    if (view === "form" && isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  };

  const handleDiscardAndBack = () => {
    setBackConfirmOpen(false);
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  };

  const submitForm = async (blocks: MaterialBlock[], intent: "draft" | "submit") => {
    if (!activeBatch) {
      return false;
    }

    if (!subDepartmentId) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    const hasAnyDraftData = (blocks ?? []).some((block) => {
      if ((block?.lotNo ?? "").trim().length > 0) {
        return true;
      }

      return (block?.rows ?? []).some((row) => {
        const analysedResult = String(row?.analysedResult ?? "").trim();
        const remarks = String(row?.remarks ?? "").trim();
        return analysedResult.length > 0 || remarks.length > 0;
      });
    });

    const materials = mapBlocksToMaterialsPayload(blocks)
      .map((item) => {
        if (intent !== "draft") {
          return item;
        }

        const filteredSpecifications = (item.specifications ?? []).filter((spec) => {
          const hasAnalysedResult = spec.analysedResult !== null && spec.analysedResult !== undefined;
          const hasRemarks = String(spec.remarks ?? "").trim().length > 0;
          return Boolean(spec.specificationCode) && (hasAnalysedResult || hasRemarks);
        });

        return {
          ...item,
          specifications: filteredSpecifications,
        };
      })
      .filter((item) => {
        if (!item.materialCode) {
          return false;
        }

        if (intent !== "draft") {
          return item.specifications.some((spec) => spec.specificationCode);
        }

        return item.lotNo.trim().length > 0 || item.specifications.length > 0;
      });

    if ((intent === "draft" && !hasAnyDraftData) || !materials.length) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const isCreateFlow = activeBatch.rmStatus === SOURCING_STATUS.INITIATED && !activeBatch.formId;

    setActionLoading(true);
    try {
      let response;

      if (isCreateFlow) {
        if (!activeBatch.batchId) {
          showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.BATCH_ID_MISSING, "error");
          return false;
        }

        response = await rawMaterialProcurementController.createForm({
          batchId: activeBatch.batchId,
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
          materials,
        });
      } else {
        if (!activeBatch.formId) {
          showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.FORM_ID_MISSING, "error");
          return false;
        }

        response = await rawMaterialProcurementController.updateForm({
          formId: activeBatch.formId,
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "UPDATE",
          materials,
        });
      }

      if (!response?.success) {
        const fallback = isCreateFlow
          ? STRINGS.SOURCING.SPECIFICATION_FORM.CREATE_FAILED
          : STRINGS.SOURCING.SPECIFICATION_FORM.UPDATE_FAILED;
        showAlert(getErrorMessage(response, fallback), "error");
        return false;
      }

      const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
      setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
      setInitialSnapshot(JSON.stringify(blocks));
      setFormBlocks(blocks);

      if (intent === "draft") {
        showAlert(
          isCreateFlow
            ? STRINGS.SOURCING.SPECIFICATION_FORM.CREATE_DRAFT_SUCCESS
            : STRINGS.SOURCING.SPECIFICATION_FORM.UPDATE_DRAFT_SUCCESS,
          "success",
          { autoCloseMs: 2200 }
        );
        setHasSavedDraft(true);
      } else {
        showAlert(
          isCreateFlow
            ? STRINGS.SOURCING.SPECIFICATION_FORM.CREATE_SUBMIT_SUCCESS
            : STRINGS.SOURCING.SPECIFICATION_FORM.UPDATE_SUBMIT_SUCCESS,
          "success",
          { autoCloseMs: 2200 }
        );

        await listParams.refreshUserBatches();
        resetFormContext();
      }

      return true;
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDraft = async (blocks: MaterialBlock[]) => {
    return await submitForm(blocks, "draft");
  };

  const handleSubmit = async (blocks: MaterialBlock[]) => {
    return await submitForm(blocks, "submit");
  };

  return {
    view,
    activeBatch,
    isEditMode,
    formBlocks,
    isFormDirty,
    loadingFormDetails,
    actionLoading,
    backConfirmOpen,
    ...listParams, // provides batches, totalRecords, page, etc.
    handleFillForm,
    handleEditForm,
    handleBack,
    handleBlocksChange,
    handleDiscardAndBack,
    setBackConfirmOpen,
    handleSaveDraft,
    handleSubmit,
  };
};

export default useRawMaterialProcurementHook;
