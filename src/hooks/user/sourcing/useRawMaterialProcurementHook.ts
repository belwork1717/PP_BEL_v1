import { useCallback, useMemo, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import rawMaterialProcurementController from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import {
  createEmptyFormBatch,
  lotListRowToFormBatch,
  mapBlocksToCreateMaterials,
  mapFirstBlockToLotUpdatePayload,
  MaterialBlock,
  RawMaterialFormBatch,
  RawMaterialLotDetailsModel,
  RawMaterialLotListRow,
  SourcingStatus,
  SOURCING_STATUS,
} from "../../../data/models/user/RawMaterialProcurementModel";
import { useRawMaterialLotList } from "./useRawMaterialLotList";

type WorkflowView = "list" | "form";
type FormEntryMode = "create" | "fill" | "edit";

export const useRawMaterialProcurementHook = () => {
  const [view, setView] = useState<WorkflowView>("list");
  const [formEntryMode, setFormEntryMode] = useState<FormEntryMode>("create");
  const [activeBatch, setActiveBatch] = useState<RawMaterialFormBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formBlocks, setFormBlocks] = useState<MaterialBlock[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState("[]");
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  const listParams = useRawMaterialLotList();
  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "raw-material")?.subDepartmentId,
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
    setFormEntryMode("create");
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

  const handleCreateLot = () => {
    setFormEntryMode("create");
    setActiveBatch(createEmptyFormBatch());
    setFormBlocks([]);
    setInitialSnapshot("[]");
    setIsEditMode(false);
    setView("form");
  };

  const openLotFromList = async (row: RawMaterialLotListRow, mode: FormEntryMode) => {
    if (!subDepartmentId) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SUB_DEPARTMENT_MISSING, "error");
      return;
    }

    setLoadingFormDetails(true);
    const detailsResponse = await rawMaterialProcurementController.fetchLotDetails({ lotId: row.lotId });
    setLoadingFormDetails(false);

    let blocks: MaterialBlock[] = [];

    if (detailsResponse?.success && detailsResponse.data) {
      blocks = RawMaterialLotDetailsModel.toMaterialBlocks(detailsResponse.data);
      const wf = detailsResponse.data.workflowInsights;
      const batch = lotListRowToFormBatch(row, blocks);
      batch.rejectionReason = wf?.rejectionReason ?? null;
      batch.rmStatus = (wf?.currentStatus || row.rmStatus) as SourcingStatus;
      setActiveBatch(batch);
    } else if (detailsResponse?.statusCode === 404) {
      blocks = [
        {
          material: row.materialCode,
          lotNo: row.lotId,
          supplyOrderNo: row.supplyOrderNo,
          receiptDate: row.receiptDate,
          manufacturerName: row.manufacturerName,
          certificates: [],
          rows: [],
        },
      ];
      setActiveBatch({
        ...lotListRowToFormBatch(row, blocks),
        rejectionReason: null,
      });
    } else {
      const fallback =
        detailsResponse?.statusCode === 404
          ? STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_NOT_FOUND
          : STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_FETCH_ERROR;
      showAlert(getErrorMessage(detailsResponse, fallback), "error");
      return;
    }

    setFormBlocks(blocks);
    setInitialSnapshot(JSON.stringify(blocks));
    setFormEntryMode(mode);
    setIsEditMode(mode === "edit");
    setView("form");
  };

  const handleFillForm = async (row: RawMaterialLotListRow) => {
    await openLotFromList(row, "fill");
  };

  const handleEditLot = async (row: RawMaterialLotListRow) => {
    await openLotFromList(row, "edit");
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
      if ((block?.lotNo ?? "").trim().length > 0) return true;
      if ((block?.supplyOrderNo ?? "").trim().length > 0) return true;
      if ((block?.manufacturerName ?? "").trim().length > 0) return true;
      return (block?.rows ?? []).some((row) => {
        const analysedResult = String(row?.analysedResult ?? "").trim();
        const remarks = String(row?.remarks ?? "").trim();
        return analysedResult.length > 0 || remarks.length > 0;
      });
    });

    if (formEntryMode === "create") {
      const mapped = mapBlocksToCreateMaterials(blocks);
      const materials = mapped
        .map((mat) => ({
          ...mat,
          lots: mat.lots
            .map((lot, lotIdx) => {
              const trimmed = lot.lotId.trim();
              const lotId =
                trimmed ||
                (intent === "draft" && lot.specifications.length > 0
                  ? `DRAFT-${mat.materialCode}-${lotIdx + 1}`
                  : "");
              return { ...lot, lotId };
            })
            .filter((lot) => lot.lotId && lot.specifications.length > 0),
        }))
        .filter((mat) => mat.materialCode && mat.lots.length > 0);

      if ((intent === "draft" && !hasAnyDraftData) || !materials.length) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.EMPTY_FORM_ERROR, "warning");
        return false;
      }

      setActionLoading(true);
      try {
        const response = await rawMaterialProcurementController.createForm({
          subDepartmentId,
          submissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
          materials,
        });

        if (!response?.success) {
          showAlert(getErrorMessage(response, STRINGS.SOURCING.SPECIFICATION_FORM.CREATE_FAILED), "error");
          return false;
        }

        setInitialSnapshot(JSON.stringify(blocks));
        setFormBlocks(blocks);
        setActiveBatch((prev) =>
          prev
            ? {
                ...prev,
                procurementId: response.data?.procurementId ?? prev.procurementId,
                batchId: response.data?.procurementId || prev.batchId,
                rmStatus: (response.data?.status as typeof prev.rmStatus) || prev.rmStatus,
              }
            : prev
        );

        if (intent === "draft") {
          showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.CREATE_DRAFT_SUCCESS, "success", { autoCloseMs: 2200 });
          setHasSavedDraft(true);
        } else {
          showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.CREATE_SUBMIT_SUCCESS, "success", { autoCloseMs: 2200 });
          await listParams.refreshUserBatches();
          resetFormContext();
        }
        return true;
      } finally {
        setActionLoading(false);
      }
    }

    const lotId = (activeBatch.lotId ?? blocks[0]?.lotNo ?? "").trim();
    if (!lotId) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.BATCH_ID_MISSING, "error");
      return false;
    }

    const head = blocks[0];
    if (!head) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    if (intent === "submit") {
      const hasSpec = head.rows.some(
        (r) => (r.specificationCode ?? "").trim() && String(r.analysedResult ?? "").trim()
      );
      if (!hasSpec) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SUBMIT_DISABLED_TOOLTIP, "warning");
        return false;
      }
    }

    setActionLoading(true);
    try {
      const submissionType: "DRAFT" | "UPDATE" =
        intent === "draft" ? "DRAFT" : activeBatch.rmStatus === SOURCING_STATUS.REJECTED ? "UPDATE" : "UPDATE";

      const updatePayload = mapFirstBlockToLotUpdatePayload(head, lotId, subDepartmentId, submissionType);

      const response = await rawMaterialProcurementController.updateForm(updatePayload);

      if (!response?.success) {
        showAlert(getErrorMessage(response, STRINGS.SOURCING.SPECIFICATION_FORM.UPDATE_FAILED), "error");
        return false;
      }

      setInitialSnapshot(JSON.stringify(blocks));
      setFormBlocks(blocks);
      setActiveBatch((prev) =>
        prev
          ? {
              ...prev,
              formId: response.data?.formId ?? prev.formId,
              batchId: response.data?.batchId ?? prev.batchId,
              rmStatus: (response.data?.status as typeof prev.rmStatus) || prev.rmStatus,
            }
          : prev
      );

      if (intent === "draft") {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.UPDATE_DRAFT_SUCCESS, "success", { autoCloseMs: 2200 });
        setHasSavedDraft(true);
      } else {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.UPDATE_SUBMIT_SUCCESS, "success", { autoCloseMs: 2200 });
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
    formEntryMode,
    activeBatch,
    isEditMode,
    formBlocks,
    isFormDirty,
    loadingFormDetails,
    actionLoading,
    backConfirmOpen,
    handleCreateLot,
    handleEditLot,
    ...listParams,
    handleFillForm,
    handleBack,
    handleBlocksChange,
    handleDiscardAndBack,
    setBackConfirmOpen,
    handleSaveDraft,
    handleSubmit,
  };
};

export default useRawMaterialProcurementHook;
