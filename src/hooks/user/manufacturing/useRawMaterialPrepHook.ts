// src/hooks/user/manufacturing/useRawMaterialPrepHook.ts

import { useCallback, useMemo, useState } from "react";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { STRINGS } from "../../../app/config/strings";
import { MANUFACTURING_STATUS } from "./manufacturingWorkflowData";
import { ManufacturingBatch, WorkflowView } from "./useManufacturingWorkflow";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import rawMaterialPreparationController from "../../../controllers/user/manufacturing/rawMaterialPreparationController";
import {
  mapLiquidFromDetails,
  mapLinearFromDetails,
  mapPreparationPayload,
  mapSolidInstancesFromDetails,
  getSelectedTypesFromMaterialTypes,
} from "../../../data/models/user/RawMaterialPreparationModel";
import { PART_A_INITIAL } from "./liquidPreparationConfig";
import { createLinearPreparationData } from "./linearPreparationConfig";

const RM_STATUS = MANUFACTURING_STATUS;

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const deriveTypes = (material: any) => {
  const m = String(material ?? "").toLowerCase();
  return { solid: m === "solid" || m === "both", liquid: m === "liquid" || m === "both", linear: m === "linear" };
};

export const isMaterialUnset = (material: any) =>
  String(material ?? "").toLowerCase() === "type not selected yet";

export interface MaterialTypes {
  solid: boolean;
  liquid: boolean;
  linear: boolean;
}

type LiquidPartAState = {
  jacketTemp: string;
  rpm: string;
  time: string;
};

type LiquidPartBRow = {
  id: number;
  material: string;
  percentage: string;
  weightKg: string;
  lotNo: string;
  dateTime: string;
  remarks: string;
};

type LinearState = ReturnType<typeof createLinearPreparationData>;

type SolidProcessInstance = {
  instanceId: number;
  processKey: string;
  data: any;
};

export type RawMaterialPrepBatch = ManufacturingBatch & {
  rmStatus?: string;
  material?: string;
  formId?: string | null;
};

const DEFAULT_TYPES: MaterialTypes = { solid: false, liquid: false, linear: false };
const DEFAULT_LIQUID_PART_A: LiquidPartAState = {
  jacketTemp: String(PART_A_INITIAL.jacketTemp ?? ""),
  rpm: String(PART_A_INITIAL.rpm ?? ""),
  time: String(PART_A_INITIAL.time ?? ""),
};
const DEFAULT_LINEAR = createLinearPreparationData();

const createDefaultFormState = () => ({
  selectedTypes: { ...DEFAULT_TYPES },
  solidInstances: [] as SolidProcessInstance[],
  liquidPartA: { ...DEFAULT_LIQUID_PART_A },
  liquidRows: [] as LiquidPartBRow[],
  linearData: createLinearPreparationData(),
});

const parseStatus = (status: string | undefined) => String(status ?? "").toLowerCase();

export const useRawMaterialPrepHook = () => {
  const listParams = useSubdepartmentBatches("raw-material-prep");
  const showAlert = useAlertStore((state) => state.showAlert);
  const user = useAuthStore((s) => s.user);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "raw-material-prep")
        ?.subDepartmentId,
    [user]
  );

  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<RawMaterialPrepBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  // Material type and form state
  const [selectedTypes, setSelectedTypes] = useState<MaterialTypes>(DEFAULT_TYPES);
  const [solidInstances, setSolidInstances] = useState<SolidProcessInstance[]>([]);
  const [liquidPartA, setLiquidPartA] = useState<LiquidPartAState>(DEFAULT_LIQUID_PART_A);
  const [liquidRows, setLiquidRows] = useState<LiquidPartBRow[]>([]);
  const [linearData, setLinearData] = useState<LinearState>(DEFAULT_LINEAR);
  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  const materialTypesArray = useMemo(() => {
    const types: Array<"solid" | "liquid" | "linear"> = [];
    if (selectedTypes.solid) types.push("solid");
    if (selectedTypes.liquid) types.push("liquid");
    if (selectedTypes.linear) types.push("linear");
    return types;
  }, [selectedTypes]);

  const solidHasData = useMemo(() => {
    return solidInstances.some((instance) => Object.keys(instance?.data ?? {}).length > 0);
  }, [solidInstances]);

  const liquidHasData = useMemo(() => {
    const partAHasData = Object.values(liquidPartA).some((v) => String(v).trim().length > 0);
    const rowsHaveData = liquidRows.some((row) =>
      [row.material, row.percentage, row.weightKg, row.lotNo, row.dateTime, row.remarks]
        .some((v) => String(v).trim().length > 0)
    );
    return partAHasData || rowsHaveData;
  }, [liquidPartA, liquidRows]);

  const linearHasData = useMemo(() => {
    const premixHasData = Object.values(linearData.premix ?? {}).some((v) => String(v).trim().length > 0);
    const finalHasData = Object.values(linearData.finalMix ?? {}).some((v) => String(v).trim().length > 0);
    return premixHasData || finalHasData;
  }, [linearData]);

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        selectedTypes,
        solidInstances,
        liquidPartA,
        liquidRows,
        linearData,
      }),
    [selectedTypes, solidInstances, liquidPartA, liquidRows, linearData]
  );

  const isFormDirty = useMemo(
    () => view === "form" && formSnapshot !== initialSnapshot,
    [view, formSnapshot, initialSnapshot]
  );

  const resetFormContext = useCallback(() => {
    const defaults = createDefaultFormState();
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setHasSavedDraft(false);
    setSelectedTypes(defaults.selectedTypes);
    setSolidInstances(defaults.solidInstances);
    setLiquidPartA(defaults.liquidPartA);
    setLiquidRows(defaults.liquidRows);
    setLinearData(defaults.linearData);
    setInitialSnapshot(
      JSON.stringify({
        selectedTypes: defaults.selectedTypes,
        solidInstances: defaults.solidInstances,
        liquidPartA: defaults.liquidPartA,
        liquidRows: defaults.liquidRows,
        linearData: defaults.linearData,
      })
    );
  }, []);

  const getErrorMessage = (response: any, fallbackMessage: string) => {
    if (response?.error?.details) return response.error.details;
    if (response?.message) return response.message;
    return fallbackMessage;
  };

  const openFormWithResolvedData = useCallback(async (batch: RawMaterialPrepBatch, editMode: boolean) => {
    const status = parseStatus(batch.rmStatus);
    const shouldFetchDetails =
      editMode ||
      status === parseStatus(RM_STATUS.IN_PROGRESS) ||
      status === parseStatus(RM_STATUS.REJECTED);

    let nextBatch = batch;
    let nextSelectedTypes = deriveTypes(batch.material);
    let nextSolidInstances: SolidProcessInstance[] = [];
    let nextLiquidPartA = { ...DEFAULT_LIQUID_PART_A };
    let nextLiquidRows: LiquidPartBRow[] = [];
    let nextLinearData = createLinearPreparationData();

    if (shouldFetchDetails) {
      if (!subDepartmentId) {
        showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SUB_DEPARTMENT_MISSING, "error");
        return;
      }

      if (!batch.formId) {
        showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.FORM_ID_MISSING, "error");
        return;
      }

      setLoadingFormDetails(true);
      const detailsResponse = await rawMaterialPreparationController.fetchFormDetails({
        formId: batch.formId,
        subDepartmentId,
      });
      setLoadingFormDetails(false);

      if (!detailsResponse?.success || !detailsResponse?.data) {
        const fallback =
          detailsResponse?.statusCode === 404
            ? STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.DETAILS_NOT_FOUND
            : STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.DETAILS_FETCH_ERROR;
        showAlert(getErrorMessage(detailsResponse, fallback), "error");
        return;
      }

      const details = detailsResponse.data;
      nextBatch = {
        ...batch,
        formId: details.formId || batch.formId,
      };
      nextSelectedTypes = getSelectedTypesFromMaterialTypes(details.materialTypes as any);
      nextSolidInstances = mapSolidInstancesFromDetails(details as any);

      const liquidMapped = mapLiquidFromDetails(details as any);
      nextLiquidPartA = liquidMapped.partA;
      nextLiquidRows = liquidMapped.rows;

      nextLinearData = mapLinearFromDetails(details as any);
    }

    const snapshot = JSON.stringify({
      selectedTypes: nextSelectedTypes,
      solidInstances: nextSolidInstances,
      liquidPartA: nextLiquidPartA,
      liquidRows: nextLiquidRows,
      linearData: nextLinearData,
    });

    setActiveBatch(nextBatch);
    setIsEditMode(editMode);
    setSelectedTypes(nextSelectedTypes);
    setSolidInstances(nextSolidInstances);
    setLiquidPartA(nextLiquidPartA);
    setLiquidRows(nextLiquidRows);
    setLinearData(nextLinearData);
    setInitialSnapshot(snapshot);
    setView("form");
  }, [showAlert, subDepartmentId]);

  const handleFillForm = useCallback(
    async (batch: RawMaterialPrepBatch) => await openFormWithResolvedData(batch, false),
    [openFormWithResolvedData]
  );

  const handleEditForm = useCallback(
    async (batch: RawMaterialPrepBatch) => await openFormWithResolvedData(batch, true),
    [openFormWithResolvedData]
  );

  const handleBack = useCallback(() => {
    if (isFormDirty) {
      setBackConfirmOpen(true);
      return;
    }
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  }, [isFormDirty, resetFormContext, bumpBatchRefresh, hasSavedDraft]);

  const handleDiscardAndBack = useCallback(() => {
    if (hasSavedDraft) bumpBatchRefresh();
    resetFormContext();
  }, [resetFormContext, bumpBatchRefresh, hasSavedDraft]);

  const handleSolidBlocksChange = useCallback(
    (blocks: SolidProcessInstance[]) => {
      setSolidInstances(blocks ?? []);
    },
    []
  );

  const handleLiquidBlocksChange = useCallback(
    (payload: { partA: LiquidPartAState; rows: LiquidPartBRow[] }) => {
      setLiquidPartA(payload?.partA ?? { ...DEFAULT_LIQUID_PART_A });
      setLiquidRows(payload?.rows ?? []);
    },
    []
  );

  const handleLinearBlocksChange = useCallback(
    (payload: LinearState) => {
      setLinearData(payload ?? createLinearPreparationData());
    },
    []
  );

  const submitForm = useCallback(async (intent: "draft" | "submit") => {
    if (!activeBatch) return false;

    if (!subDepartmentId) {
      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    if (!materialTypesArray.length) {
      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SELECT_AT_LEAST_ONE, "warning");
      return false;
    }

    const hasAnyData =
      (selectedTypes.solid && solidHasData) ||
      (selectedTypes.liquid && liquidHasData) ||
      (selectedTypes.linear && linearHasData);

    if (!hasAnyData) {
      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.EMPTY_FORM_ERROR, "warning");
      return false;
    }

    const status = parseStatus(activeBatch.rmStatus);
    const isCreateFlow = status === parseStatus(RM_STATUS.INITIATED) && !activeBatch.formId;

    const payloadBody = mapPreparationPayload({
      selectedTypes,
      solidInstances,
      liquidData: {
        partA: liquidPartA,
        rows: liquidRows,
      },
      linearData,
      intent,
    });

    setActionLoading(true);
    try {
      let response: any;

      if (isCreateFlow) {
        if (!activeBatch.batchId) {
          showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.BATCH_ID_MISSING, "error");
          return false;
        }

        response = await rawMaterialPreparationController.createForm({
          batchId: activeBatch.batchId,
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
          ...payloadBody,
        });
      } else {
        if (!activeBatch.formId) {
          showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.FORM_ID_MISSING, "error");
          return false;
        }

        response = await rawMaterialPreparationController.updateForm({
          formId: activeBatch.formId,
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "UPDATE",
          ...payloadBody,
        });
      }

      if (!response?.success) {
        const fallback = isCreateFlow
          ? STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.CREATE_FAILED
          : STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.UPDATE_FAILED;
        showAlert(getErrorMessage(response, fallback), "error");
        return false;
      }

      const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
      setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId } : prev));
      setInitialSnapshot(formSnapshot);

      if (intent === "draft") {
        showAlert(
          isCreateFlow
            ? STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.CREATE_DRAFT_SUCCESS
            : STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.UPDATE_DRAFT_SUCCESS,
          "success",
          { autoCloseMs: 2200 }
        );
        setHasSavedDraft(true);
      } else {
        showAlert(
          isCreateFlow
            ? STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.CREATE_SUBMIT_SUCCESS
            : STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.UPDATE_SUBMIT_SUCCESS,
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
  }, [
    activeBatch,
    subDepartmentId,
    materialTypesArray,
    selectedTypes,
    solidInstances,
    liquidPartA,
    liquidRows,
    linearData,
    solidHasData,
    liquidHasData,
    linearHasData,
    showAlert,
    formSnapshot,
    listParams,
    resetFormContext,
  ]);

  const handleSaveDraft = useCallback(async () => {
    return await submitForm("draft");
  }, [submitForm]);

  const handleSubmit = useCallback(async () => {
    return await submitForm("submit");
  }, [submitForm]);

  return {
    ...listParams,
    loading: listParams.loading || loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    backConfirmOpen,
    isFormDirty,
    loadingFormDetails,
    actionLoading,
    selectedTypes,
    materialTypesArray,
    solidInstances,
    liquidPartA,
    liquidRows,
    linearData,
    setBackConfirmOpen,
    setSelectedTypes,
    solidHasData,
    liquidHasData,
    linearHasData,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleSolidBlocksChange,
    handleLiquidBlocksChange,
    handleLinearBlocksChange,
    handleSaveDraft,
    handleSubmit,
  };
};

export default useRawMaterialPrepHook;
