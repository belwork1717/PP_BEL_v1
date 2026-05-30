// src/hooks/user/manufacturing/useRawMaterialPrepHook.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { operationsController } from "../../../controllers/user/operationsController";
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
import {
  DEFAULT_SELECTED_PROCESSES,
  PREMIX_OPTIONS,
  getPrepMaterialGrades,
  materialRequiresGradeSelection,
  normalizeMaterialsList,
  type RawMaterialPrepMaterialOption,
  type RawMaterialPrepProcessKey,
  type RawMaterialPrepSelectedProcesses,
} from "./rawMaterialPrepFlowConfig";

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

type PremixSession = {
  selectedProcesses: RawMaterialPrepSelectedProcesses;
  solidMaterialCode: string;
  solidGradeCode: string;
  liquidMaterialCode: string;
  solidInstances: SolidProcessInstance[];
  liquidPartA: LiquidPartAState;
  liquidRows: LiquidPartBRow[];
};

type AddedPremixSelection = {
  premix: number;
  selectedProcesses: RawMaterialPrepSelectedProcesses;
  solidMaterialCode: string;
  solidGradeCode: string;
  liquidMaterialCode: string;
};

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

const DEFAULT_LIQUID_PART_A: LiquidPartAState = {
  jacketTemp: String(PART_A_INITIAL.jacketTemp ?? ""),
  rpm: String(PART_A_INITIAL.rpm ?? ""),
  time: String(PART_A_INITIAL.time ?? ""),
};
const DEFAULT_LINEAR = createLinearPreparationData();

const createEmptyPremixSession = (): PremixSession => ({
  selectedProcesses: { ...DEFAULT_SELECTED_PROCESSES },
  solidMaterialCode: "",
  solidGradeCode: "",
  liquidMaterialCode: "",
  solidInstances: [],
  liquidPartA: { ...DEFAULT_LIQUID_PART_A },
  liquidRows: [],
});

const createDefaultFormState = () => ({
  selectedPremix: "" as number | "",
  selectedProcesses: { ...DEFAULT_SELECTED_PROCESSES },
  solidMaterialCode: "",
  solidGradeCode: "",
  liquidMaterialCode: "",
  solidInstances: [] as SolidProcessInstance[],
  liquidPartA: { ...DEFAULT_LIQUID_PART_A },
  liquidRows: [] as LiquidPartBRow[],
  linearData: createLinearPreparationData(),
});

const normalizePremixSession = (session?: Partial<PremixSession> | null): PremixSession => {
  const legacyProcess = (session as { process?: string })?.process;
  const rawProcesses = session?.selectedProcesses;
  const selectedProcesses: RawMaterialPrepSelectedProcesses = {
    solid: Boolean(rawProcesses?.solid ?? legacyProcess === "solid"),
    liquid: Boolean(rawProcesses?.liquid ?? legacyProcess === "liquid"),
  };

  return {
    selectedProcesses,
    solidMaterialCode: session?.solidMaterialCode ?? "",
    solidGradeCode: session?.solidGradeCode ?? "",
    liquidMaterialCode: session?.liquidMaterialCode ?? "",
    solidInstances: session?.solidInstances ?? [],
    liquidPartA: session?.liquidPartA ?? { ...DEFAULT_LIQUID_PART_A },
    liquidRows: session?.liquidRows ?? [],
  };
};

const isSessionFilled = (session: PremixSession) => {
  const normalized = normalizePremixSession(session);
  const solidFilled =
    normalized.selectedProcesses.solid &&
    normalized.solidInstances.some((instance) => Object.keys(instance?.data ?? {}).length > 0);
  const liquidFilled =
    normalized.selectedProcesses.liquid &&
    (Object.values(normalized.liquidPartA).some((v) => String(v).trim().length > 0) ||
      normalized.liquidRows.some((row) =>
        [row.material, row.percentage, row.weightKg, row.lotNo, row.dateTime, row.remarks]
          .some((v) => String(v).trim().length > 0)
      ));
  return solidFilled || liquidFilled;
};

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

  const [selectedPremix, setSelectedPremix] = useState<number | "">("");
  const [selectedProcesses, setSelectedProcesses] = useState<RawMaterialPrepSelectedProcesses>(
    () => ({ ...DEFAULT_SELECTED_PROCESSES })
  );
  const [solidMaterialCode, setSolidMaterialCode] = useState("");
  const [solidGradeCode, setSolidGradeCode] = useState("");
  const [liquidMaterialCode, setLiquidMaterialCode] = useState("");
  const [availableSolidMaterials, setAvailableSolidMaterials] = useState<RawMaterialPrepMaterialOption[]>([]);
  const [availableLiquidMaterials, setAvailableLiquidMaterials] = useState<RawMaterialPrepMaterialOption[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [completedPremixesByBatch, setCompletedPremixesByBatch] = useState<Record<string, number[]>>({});
  const [premixSessionsByBatch, setPremixSessionsByBatch] = useState<
    Record<string, Record<number, PremixSession>>
  >({});
  const [addedPremixSelectionsByBatch, setAddedPremixSelectionsByBatch] = useState<
    Record<string, AddedPremixSelection[]>
  >({});

  const [solidInstances, setSolidInstances] = useState<SolidProcessInstance[]>([]);
  const [liquidPartA, setLiquidPartA] = useState<LiquidPartAState>(DEFAULT_LIQUID_PART_A);
  const [liquidRows, setLiquidRows] = useState<LiquidPartBRow[]>([]);
  const [linearData, setLinearData] = useState<LinearState>(DEFAULT_LINEAR);
  const [initialSnapshot, setInitialSnapshot] = useState("{}");

  const safeSelectedProcesses = useMemo(
    () => ({
      ...DEFAULT_SELECTED_PROCESSES,
      ...(selectedProcesses ?? {}),
    }),
    [selectedProcesses]
  );

  const selectedTypes = useMemo<MaterialTypes>(
    () => ({
      solid: safeSelectedProcesses.solid,
      liquid: safeSelectedProcesses.liquid,
      linear: false,
    }),
    [safeSelectedProcesses]
  );

  const hasProcessSelected = safeSelectedProcesses.solid || safeSelectedProcesses.liquid;

  const loadMaterialsByType = useCallback(
    async (materialType: "SOLID" | "LIQUID", options?: { silent?: boolean }) => {
      const response = await operationsController.fetchMaterialsList({ materialType });
      if (response?.success && response?.data) {
        return normalizeMaterialsList(response.data);
      }
      if (!options?.silent) {
        showAlert(
          response?.message || STRINGS.SOURCING.SPECIFICATION_FORM.MATERIALS_LOAD_FAILED,
          "error"
        );
      }
      return [];
    },
    [showAlert]
  );

  const materialsLoadCountRef = useRef(0);

  const beginMaterialsLoad = useCallback(() => {
    materialsLoadCountRef.current += 1;
    setLoadingMaterials(true);
  }, []);

  const endMaterialsLoad = useCallback(() => {
    materialsLoadCountRef.current = Math.max(0, materialsLoadCountRef.current - 1);
    if (materialsLoadCountRef.current === 0) {
      setLoadingMaterials(false);
    }
  }, []);

  useEffect(() => {
    if (view !== "form" || !safeSelectedProcesses.solid) {
      setAvailableSolidMaterials([]);
      return;
    }

    let cancelled = false;
    const run = async () => {
      beginMaterialsLoad();
      try {
        const list = await loadMaterialsByType("SOLID", { silent: true });
        if (!cancelled) {
          setAvailableSolidMaterials(list);
          if (list.length === 0) {
            showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.MATERIALS_LOAD_FAILED, "error");
          }
        }
      } catch {
        if (!cancelled) {
          setAvailableSolidMaterials([]);
          showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.MATERIALS_FETCH_ERROR, "error");
        }
      } finally {
        if (!cancelled) endMaterialsLoad();
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [view, safeSelectedProcesses.solid, loadMaterialsByType, showAlert, beginMaterialsLoad, endMaterialsLoad]);

  useEffect(() => {
    if (view !== "form" || !safeSelectedProcesses.liquid) {
      setAvailableLiquidMaterials([]);
      return;
    }

    let cancelled = false;
    const run = async () => {
      beginMaterialsLoad();
      try {
        const list = await loadMaterialsByType("LIQUID", { silent: true });
        if (!cancelled) {
          setAvailableLiquidMaterials(list);
          if (list.length === 0) {
            showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.MATERIALS_LOAD_FAILED, "error");
          }
        }
      } catch {
        if (!cancelled) {
          setAvailableLiquidMaterials([]);
          showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.MATERIALS_FETCH_ERROR, "error");
        }
      } finally {
        if (!cancelled) endMaterialsLoad();
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [view, safeSelectedProcesses.liquid, loadMaterialsByType, showAlert, beginMaterialsLoad, endMaterialsLoad]);

  const materialTypesArray = useMemo(() => {
    const types: Array<"solid" | "liquid"> = [];
    if (selectedTypes.solid) types.push("solid");
    if (selectedTypes.liquid) types.push("liquid");
    return types;
  }, [selectedTypes]);

  const activeBatchId = activeBatch?.batchId ?? "";
  const activeFormBatchKey = activeBatchId || "__form__";

  const completedPremixes = useMemo(
    () => completedPremixesByBatch[activeBatchId] ?? [],
    [completedPremixesByBatch, activeBatchId]
  );

  const availablePremixOptions = useMemo(
    () => PREMIX_OPTIONS.filter((n) => !completedPremixes.includes(n)),
    [completedPremixes]
  );
  const premixSessions = useMemo(
    () => premixSessionsByBatch[activeFormBatchKey] ?? {},
    [premixSessionsByBatch, activeFormBatchKey]
  );
  const addedPremixSelections = useMemo(
    () => addedPremixSelectionsByBatch[activeFormBatchKey] ?? [],
    [addedPremixSelectionsByBatch, activeFormBatchKey]
  );

  const getCurrentPremixSession = useCallback(
    (): PremixSession => ({
      selectedProcesses: { ...selectedProcesses },
      solidMaterialCode,
      solidGradeCode,
      liquidMaterialCode,
      solidInstances,
      liquidPartA,
      liquidRows,
    }),
    [
      selectedProcesses,
      solidMaterialCode,
      solidGradeCode,
      liquidMaterialCode,
      solidInstances,
      liquidPartA,
      liquidRows,
    ]
  );

  const applyPremixSession = useCallback((session?: Partial<PremixSession> | null) => {
    const normalized = normalizePremixSession(session);
    setSelectedProcesses(normalized.selectedProcesses);
    setSolidMaterialCode(normalized.solidMaterialCode);
    setSolidGradeCode(normalized.solidGradeCode);
    setLiquidMaterialCode(normalized.liquidMaterialCode);
    setSolidInstances(normalized.solidInstances);
    setLiquidPartA(normalized.liquidPartA);
    setLiquidRows(normalized.liquidRows);
  }, []);

  const markPremixComplete = useCallback(
    (batchId: string, premix: number) => {
      if (!batchId || !premix) return;
      setCompletedPremixesByBatch((prev) => {
        const existing = prev[batchId] ?? [];
        if (existing.includes(premix)) return prev;
        return { ...prev, [batchId]: [...existing, premix].sort((a, b) => a - b) };
      });
    },
    []
  );

  const persistCurrentPremixSession = useCallback(
    (batchId: string, premix: number | "") => {
      if (!batchId || premix === "") return;
      const session = getCurrentPremixSession();
      setPremixSessionsByBatch((prev) => ({
        ...prev,
        [batchId]: { ...(prev[batchId] ?? {}), [premix]: session },
      }));
      if (isSessionFilled(session)) {
        markPremixComplete(batchId, premix);
      }
    },
    [getCurrentPremixSession, markPremixComplete]
  );

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

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        selectedPremix,
        selectedProcesses,
        solidMaterialCode,
        liquidMaterialCode,
        solidInstances,
        liquidPartA,
        liquidRows,
      }),
    [
      selectedPremix,
      selectedProcesses,
      solidMaterialCode,
      solidGradeCode,
      liquidMaterialCode,
      solidInstances,
      liquidPartA,
      liquidRows,
    ]
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
    setSelectedPremix(defaults.selectedPremix);
    setSelectedProcesses(defaults.selectedProcesses);
    setSolidMaterialCode(defaults.solidMaterialCode);
    setSolidGradeCode(defaults.solidGradeCode);
    setLiquidMaterialCode(defaults.liquidMaterialCode);
    setAvailableSolidMaterials([]);
    setAvailableLiquidMaterials([]);
    materialsLoadCountRef.current = 0;
    setLoadingMaterials(false);
    setSolidInstances(defaults.solidInstances);
    setLiquidPartA(defaults.liquidPartA);
    setLiquidRows(defaults.liquidRows);
    setLinearData(defaults.linearData);
    setInitialSnapshot(
      JSON.stringify({
        selectedPremix: defaults.selectedPremix,
        selectedProcesses: defaults.selectedProcesses,
        solidMaterialCode: defaults.solidMaterialCode,
        solidGradeCode: defaults.solidGradeCode,
        liquidMaterialCode: defaults.liquidMaterialCode,
        solidInstances: defaults.solidInstances,
        liquidPartA: defaults.liquidPartA,
        liquidRows: defaults.liquidRows,
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
    let nextSelectedProcesses = { ...DEFAULT_SELECTED_PROCESSES };
    let nextSolidMaterialCode = "";
    let nextLiquidMaterialCode = "";
    let nextPremix: number | "" = "";
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
      const loadedTypes = getSelectedTypesFromMaterialTypes(details.materialTypes as any);
      nextSelectedProcesses = {
        solid: loadedTypes.solid,
        liquid: loadedTypes.liquid,
      };
      nextPremix = 1;
      nextSolidInstances = mapSolidInstancesFromDetails(details as any);

      const liquidMapped = mapLiquidFromDetails(details as any);
      nextLiquidPartA = liquidMapped.partA;
      nextLiquidRows = liquidMapped.rows;

      nextLinearData = mapLinearFromDetails(details as any);
    }

    const snapshot = JSON.stringify({
      selectedPremix: nextPremix,
      selectedProcesses: nextSelectedProcesses,
      solidMaterialCode: nextSolidMaterialCode,
      liquidMaterialCode: nextLiquidMaterialCode,
      solidInstances: nextSolidInstances,
      liquidPartA: nextLiquidPartA,
      liquidRows: nextLiquidRows,
    });

    setActiveBatch(nextBatch);
    setIsEditMode(editMode);
    setSelectedPremix(nextPremix);
    setSelectedProcesses(nextSelectedProcesses);
    setSolidMaterialCode(nextSolidMaterialCode);
    setLiquidMaterialCode(nextLiquidMaterialCode);
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

  const handlePremixChange = useCallback(
    (premix: number | "") => {
      if (!activeBatchId) {
        setSelectedPremix(premix);
        return;
      }
      if (selectedPremix !== "") {
        persistCurrentPremixSession(activeBatchId, selectedPremix);
      }
      setSelectedPremix(premix);
      if (premix === "") {
        applyPremixSession(createEmptyPremixSession());
        return;
      }
      const saved = premixSessionsByBatch[activeBatchId]?.[premix];
      applyPremixSession(saved ?? createEmptyPremixSession());
    },
    [activeBatchId, selectedPremix, persistCurrentPremixSession, premixSessionsByBatch, applyPremixSession]
  );

  const handleProcessToggle = useCallback(
    (process: RawMaterialPrepProcessKey, checked: boolean) => {
      setSelectedProcesses((prev) => ({
        ...DEFAULT_SELECTED_PROCESSES,
        ...(prev ?? {}),
        [process]: checked,
      }));
      if (!checked) {
        if (process === "solid") {
          setSolidMaterialCode("");
          setSolidGradeCode("");
          setSolidInstances([]);
          setAvailableSolidMaterials([]);
        } else {
          setLiquidMaterialCode("");
          setLiquidPartA({ ...DEFAULT_LIQUID_PART_A });
          setLiquidRows([]);
          setAvailableLiquidMaterials([]);
        }
      }
    },
    []
  );

  const handleSolidMaterialChange = useCallback((materialCode: string) => {
    setSolidMaterialCode(materialCode);
    setSolidGradeCode("");
  }, []);

  const handleSolidGradeChange = useCallback((gradeCode: string) => {
    setSolidGradeCode(gradeCode);
  }, []);

  const handleLiquidMaterialChange = useCallback((materialCode: string) => {
    setLiquidMaterialCode(materialCode);
  }, []);

  const handleAddPremixSelection = useCallback(() => {
    if (selectedPremix === "") return;

    const hasSolid = Boolean(selectedProcesses.solid);
    const hasLiquid = Boolean(selectedProcesses.liquid);
    if (!hasSolid && !hasLiquid) return;
    if (hasSolid && !solidMaterialCode) return;
    if (
      hasSolid &&
      materialRequiresGradeSelection(availableSolidMaterials, solidMaterialCode) &&
      !solidGradeCode
    ) {
      return;
    }
    if (hasLiquid && !liquidMaterialCode) return;

    const nextEntry: AddedPremixSelection = {
      premix: selectedPremix,
      selectedProcesses: {
        solid: hasSolid,
        liquid: hasLiquid,
      },
      solidMaterialCode,
      solidGradeCode: hasSolid ? solidGradeCode : "",
      liquidMaterialCode,
    };
    const nextSession: PremixSession = {
      selectedProcesses: {
        solid: hasSolid,
        liquid: hasLiquid,
      },
      solidMaterialCode,
      solidGradeCode: hasSolid ? solidGradeCode : "",
      liquidMaterialCode,
      solidInstances: [],
      liquidPartA: { ...DEFAULT_LIQUID_PART_A },
      liquidRows: [],
    };

    setAddedPremixSelectionsByBatch((prev) => {
      const list = prev[activeFormBatchKey] ?? [];
      const withoutCurrent = list.filter((entry) => entry.premix !== selectedPremix);
      const nextList = [...withoutCurrent, nextEntry].sort((a, b) => a.premix - b.premix);
      return {
        ...prev,
        [activeFormBatchKey]: nextList,
      };
    });
    setPremixSessionsByBatch((prev) => ({
      ...prev,
      [activeFormBatchKey]: {
        ...(prev[activeFormBatchKey] ?? {}),
        [selectedPremix]: nextSession,
      },
    }));

    if (activeBatchId) {
      markPremixComplete(activeBatchId, selectedPremix);
    }

    setSelectedPremix("");
    applyPremixSession(createEmptyPremixSession());
  }, [
    selectedPremix,
    selectedProcesses,
    solidMaterialCode,
    solidGradeCode,
    liquidMaterialCode,
    activeFormBatchKey,
    activeBatchId,
    markPremixComplete,
    applyPremixSession,
    availableSolidMaterials,
  ]);

  const handlePremixSolidBlocksChange = useCallback(
    (premix: number, blocks: SolidProcessInstance[]) => {
      if (!premix) return;
      setPremixSessionsByBatch((prev) => {
        const batchSessions = prev[activeFormBatchKey] ?? {};
        const current = normalizePremixSession(batchSessions[premix]);
        return {
          ...prev,
          [activeFormBatchKey]: {
            ...batchSessions,
            [premix]: {
              ...current,
              solidInstances: blocks ?? [],
            },
          },
        };
      });
    },
    [activeFormBatchKey]
  );

  const handlePremixLiquidBlocksChange = useCallback(
    (premix: number, payload: { partA: LiquidPartAState; rows: LiquidPartBRow[] }) => {
      if (!premix) return;
      setPremixSessionsByBatch((prev) => {
        const batchSessions = prev[activeFormBatchKey] ?? {};
        const current = normalizePremixSession(batchSessions[premix]);
        return {
          ...prev,
          [activeFormBatchKey]: {
            ...batchSessions,
            [premix]: {
              ...current,
              liquidPartA: payload?.partA ?? { ...DEFAULT_LIQUID_PART_A },
              liquidRows: payload?.rows ?? [],
            },
          },
        };
      });
    },
    [activeFormBatchKey]
  );

  const submitForm = useCallback(async (intent: "draft" | "submit") => {
    if (!activeBatch) return false;

    if (!subDepartmentId) {
      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    if (selectedPremix === "" || !hasProcessSelected) {
      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SELECT_AT_LEAST_ONE, "warning");
      return false;
    }

    if (selectedProcesses.solid && !solidMaterialCode) {
      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SELECT_RAW_MATERIAL_LABEL, "warning");
      return false;
    }

    if (selectedProcesses.liquid && !liquidMaterialCode) {
      showAlert(STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.SELECT_RAW_MATERIAL_LABEL, "warning");
      return false;
    }

    const hasAnyData =
      (selectedProcesses.solid && solidHasData) ||
      (selectedProcesses.liquid && liquidHasData);

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
      if (activeBatchId) {
        persistCurrentPremixSession(activeBatchId, selectedPremix);
        markPremixComplete(activeBatchId, selectedPremix);
      }

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
    selectedPremix,
    selectedProcesses,
    solidMaterialCode,
    liquidMaterialCode,
    hasProcessSelected,
    showAlert,
    formSnapshot,
    listParams,
    resetFormContext,
    persistCurrentPremixSession,
    markPremixComplete,
    activeBatchId,
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
    selectedPremix,
    selectedProcesses: safeSelectedProcesses,
    solidMaterialCode,
    solidGradeCode,
    liquidMaterialCode,
    availableSolidMaterials: Array.isArray(availableSolidMaterials) ? availableSolidMaterials : [],
    availableLiquidMaterials: Array.isArray(availableLiquidMaterials) ? availableLiquidMaterials : [],
    loadingMaterials,
    availablePremixOptions,
    completedPremixes,
    materialTypesArray,
    solidInstances,
    liquidPartA,
    liquidRows,
    setBackConfirmOpen,
    handlePremixChange,
    handleProcessToggle,
    handleSolidMaterialChange,
    handleSolidGradeChange,
    handleLiquidMaterialChange,
    handleAddPremixSelection,
    handlePremixSolidBlocksChange,
    handlePremixLiquidBlocksChange,
    solidHasData,
    liquidHasData,
    addedPremixSelections,
    premixSessions,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleSolidBlocksChange,
    handleLiquidBlocksChange,
    handleSaveDraft,
    handleSubmit,
  };
};

export default useRawMaterialPrepHook;
