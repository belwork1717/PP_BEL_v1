import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useThemeStore } from "../../../app/store/themeStore";
import getSourcingTheme from "../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import { operationsController } from "../../../controllers/user/operationsController";
import { MaterialSpecificationItemModel } from "../../../data/models/user/MaterialSpecificationModel";
import type { MaterialBlock, SpecRow } from "../../../data/models/user/RawMaterialProcurementModel";

export type SpecificationRow = SpecRow;
export type SpecificationBlock = MaterialBlock;

type MaterialOption = {
  materialCode: string;
  materialName: string;
  specCount: number;
};

type UseRawMaterialSpecificationFormParams = {
  initialBlocks?: SpecificationBlock[];
  isEditMode?: boolean;
  /** Raw material procurement: Create Lot flow — API-oriented copy and labels */
  createLotMode?: boolean;
  onSaveDraft?: (blocks: SpecificationBlock[]) => Promise<boolean | void> | boolean | void;
  onSubmit?: (blocks: SpecificationBlock[]) => Promise<boolean | void> | boolean | void;
  onBlocksChange?: (blocks: SpecificationBlock[]) => void;
  actionLoading?: boolean;
  pdfMeta?: unknown;
};

function createBlock(material: string, targetSpecs: MaterialSpecificationItemModel[] = []): SpecificationBlock {
  return {
    material,
    lotNo: "",
    supplyOrderNo: "",
    receiptDate: "",
    manufacturerName: "",
    certificates: [],
    rows: targetSpecs.map((specification) => ({
      specificationCode: specification.specificationCode,
      specification: specification.specificationName,
      specificationName: specification.specificationName,
      refRange: specification.formattedReferenceRange,
      analysedResult: "",
      remarks: "",
      isOutOfRange: false,
      referenceRange: {
        minValue: specification.referenceRange.minValue,
        maxValue: specification.referenceRange.maxValue,
        unit: specification.referenceRange.unit,
      },
    })),
  };
}

function hasMinimumData(blocks: SpecificationBlock[]) {
  if (blocks.length === 0) return false;
  return blocks.every((block) => block.rows.some((row) => row.analysedResult.trim() !== ""));
}

type SpecificationCacheMap = Record<string, MaterialSpecificationItemModel[]>;
type LoadingMap = Record<string, boolean>;

export const useRawMaterialSpecificationForm = ({
  initialBlocks = [],
  isEditMode = false,
  createLotMode = false,
  onSaveDraft,
  onSubmit,
  onBlocksChange,
  actionLoading = false,
}: UseRawMaterialSpecificationFormParams) => {
  const [blocks, setBlocks] = useState<SpecificationBlock[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [draftConfirm, setDraftConfirm] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<MaterialOption[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [specificationCache, setSpecificationCache] = useState<SpecificationCacheMap>({});
  const [loadingByMaterial, setLoadingByMaterial] = useState<LoadingMap>({});

  const showAlert = useAlertStore((state) => state.showAlert);
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);
  const formStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const specStyles = theme.sourcing.rawMaterial.specificationForm;
  const onBlocksChangeRef = useRef(onBlocksChange);

  const headerTitle = createLotMode ? formStrings.CREATE_LOT_BUILDER_TITLE : formStrings.TITLE;
  const headerSubtitle = createLotMode ? formStrings.CREATE_LOT_BUILDER_SUBTITLE : formStrings.SUBTITLE;

  const isMaterialLoading = useCallback(
    (materialCode: string) => Boolean(loadingByMaterial[materialCode]),
    [loadingByMaterial]
  );

  const fetchMaterialSpecifications = useCallback(
    async (materialCode: string): Promise<MaterialSpecificationItemModel[]> => {
      const code = materialCode.trim();
      if (!code) return [];

      const cached = specificationCache[code];
      if (cached) return cached;

      setLoadingByMaterial((prev) => ({ ...prev, [code]: true }));

      try {
        const response = await operationsController.fetchMaterialSpecificationList({ materialCode: code });

        if (!response?.success || !response.data) {
          const msg =
            response?.statusCode === 404
              ? STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_NOT_FOUND
              : response?.message || STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_FETCH_ERROR;
          showAlert(msg, "error");
          return [];
        }

        const specifications = response.data.specifications ?? [];
        setSpecificationCache((prev) => ({ ...prev, [code]: specifications }));
        return specifications;
      } catch (error) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_FETCH_ERROR, "error");
        return [];
      } finally {
        setLoadingByMaterial((prev) => ({ ...prev, [code]: false }));
      }
    },
    [showAlert, specificationCache]
  );

  useEffect(() => {
    onBlocksChangeRef.current = onBlocksChange;
  }, [onBlocksChange]);

  useEffect(() => {
    let isActive = true;

    const loadMaterials = async () => {
      setLoadingMaterials(true);

      try {
        const response = await operationsController.fetchMaterialsList();

        if (!isActive) return;

        if (response?.success && response?.data) {
          setAvailableMaterials(response.data);
          return;
        }

        setAvailableMaterials([]);
        showAlert(response?.message || formStrings.MATERIALS_LOAD_FAILED, "error");
      } catch (error) {
        if (!isActive) return;
        setAvailableMaterials([]);
        showAlert(formStrings.MATERIALS_FETCH_ERROR, "error");
      } finally {
        if (isActive) {
          setLoadingMaterials(false);
        }
      }
    };

    void loadMaterials();

    return () => {
      isActive = false;
    };
  }, [formStrings.MATERIALS_FETCH_ERROR, formStrings.MATERIALS_LOAD_FAILED, showAlert]);

  useEffect(() => {
    if (initialBlocks.length > 0) {
      setBlocks((previous) => (previous === initialBlocks ? previous : initialBlocks));
      return;
    }

    setBlocks((previous) => (previous.length === 0 ? previous : []));
  }, [initialBlocks]);

  const updateBlocks = useCallback(
    (updater: SpecificationBlock[] | ((previous: SpecificationBlock[]) => SpecificationBlock[])) => {
      setBlocks((previous) => {
        const nextBlocks = typeof updater === "function" ? updater(previous) : updater;
        onBlocksChangeRef.current?.(nextBlocks);
        return nextBlocks;
      });
    },
    []
  );

  const totalRows = useMemo(() => blocks.flatMap((block) => block.rows).length, [blocks]);
  const filledRows = useMemo(
    () => blocks.flatMap((block) => block.rows).filter((row) => row.analysedResult.trim() !== "").length,
    [blocks]
  );
  const canSubmit = useMemo(() => hasMinimumData(blocks), [blocks]);
  const hasBlocks = blocks.length > 0;
  const actionHelperText = useMemo(() => {
    if (!hasBlocks) {
      return formStrings.NOT_READY_TITLE;
    }

    return `${blocks.length} ${blocks.length > 1 ? formStrings.MATERIAL_SUFFIX_PLURAL : formStrings.MATERIAL_SUFFIX} · ${filledRows}/${totalRows} ${formStrings.RESULTS_ENTERED_SUFFIX}`;
  }, [blocks.length, filledRows, formStrings.MATERIAL_SUFFIX, formStrings.MATERIAL_SUFFIX_PLURAL, formStrings.NOT_READY_TITLE, formStrings.RESULTS_ENTERED_SUFFIX, hasBlocks, totalRows]);
  const disableActionBar = actionLoading || !hasBlocks;

  const handleAdd = useCallback(async () => {
    if (!selectedMaterial || addingMaterial) return;

    setAddingMaterial(true);

    try {
      const specifications = await fetchMaterialSpecifications(selectedMaterial);
      if (!specifications.length) return;

      updateBlocks((previous) => [...previous, createBlock(selectedMaterial, specifications)]);
      setSelectedMaterial("");
    } finally {
      setAddingMaterial(false);
    }
  }, [addingMaterial, fetchMaterialSpecifications, selectedMaterial, updateBlocks]);

  const handleUpdateBlock = useCallback(
    (index: number, updatedBlock: SpecificationBlock) => {
      updateBlocks((previous) => previous.map((block, currentIndex) => (currentIndex === index ? updatedBlock : block)));
    },
    [updateBlocks]
  );

  const handleRemoveBlock = useCallback(
    (index: number) => {
      updateBlocks((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
    },
    [updateBlocks]
  );

  const openDraftConfirm = useCallback(() => {
    if (!hasBlocks || actionLoading) return;
    setDraftConfirm(true);
  }, [actionLoading, hasBlocks]);

  const openSubmitConfirm = useCallback(() => {
    if (!canSubmit || actionLoading) return;
    setSubmitConfirm(true);
  }, [actionLoading, canSubmit]);

  const closeDraftConfirm = useCallback(() => {
    setDraftConfirm(false);
  }, []);

  const closeSubmitConfirm = useCallback(() => {
    setSubmitConfirm(false);
  }, []);

  const handleConfirmDraft = useCallback(async () => {
    setDraftConfirm(false);
    await onSaveDraft?.(blocks);
  }, [blocks, onSaveDraft]);

  const handleConfirmSubmit = useCallback(async () => {
    setSubmitConfirm(false);
    await onSubmit?.(blocks);
  }, [blocks, onSubmit]);

  return {
    actionHelperText,
    addingMaterial,
    availableMaterials,
    blocks,
    canSubmit,
    closeDraftConfirm,
    closeSubmitConfirm,
    createLotMode,
    disableActionBar,
    draftConfirm,
    filledRows,
    formStrings,
    handleAdd,
    handleConfirmDraft,
    handleConfirmSubmit,
    handleRemoveBlock,
    handleUpdateBlock,
    hasBlocks,
    headerSubtitle,
    headerTitle,
    isEditMode,
    isMaterialLoading,
    loadingMaterials,
    openDraftConfirm,
    openSubmitConfirm,
    selectedMaterial,
    setSelectedMaterial,
    specStyles,
    submitConfirm,
    theme,
    totalRows,
  };
};

/** @deprecated Prefer useRawMaterialSpecificationForm */
export const useSpecificationFormBuilderHook = useRawMaterialSpecificationForm;

export default useRawMaterialSpecificationForm;
