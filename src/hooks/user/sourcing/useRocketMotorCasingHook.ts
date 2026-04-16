import { ChangeEvent, useMemo, useState } from "react";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { STRINGS } from "../../../app/config/strings";
import rocketMotorCasingController from "../../../controllers/user/sourcing/rocketMotorCasingController";
import {
  mapRocketFormToCasingPayload,
  RocketMotorCasingDetailsModel,
} from "../../../data/models/user/RocketMotorCasingProcurementModel";
import useDimensionalParametersHook from "../useDimensionalParametersHook";
import {
  INITIAL_ROCKET_FORM,
  RocketFormData,
  RocketMotorBatch,
  SOURCING_STATUS,
} from "./sourcingWorkflowData";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";

type WorkflowView = "list" | "form";

const getStartingFormData = (batch: RocketMotorBatch | null): RocketFormData => {
  if (!batch?.draftData) {
    return { ...INITIAL_ROCKET_FORM, dimensionalData: [] };
  }

  return {
    ...INITIAL_ROCKET_FORM,
    ...batch.draftData,
    dimensionalData: [...(batch.draftData.dimensionalData ?? [])],
  };
};

const serializeForm = (formData: RocketFormData) => {
  const mediaFilePath =
    formData.mediaFilePath && typeof formData.mediaFilePath !== "string"
      ? formData.mediaFilePath.name
      : formData.mediaFilePath;

  return JSON.stringify({
    ...formData,
    mediaFilePath: mediaFilePath ?? null,
  });
};

export const useRocketMotorCasingHook = () => {
  const [view, setView] = useState<WorkflowView>("list");
  const [activeBatch, setActiveBatch] = useState<RocketMotorBatch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<RocketFormData>(INITIAL_ROCKET_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState(serializeForm(INITIAL_ROCKET_FORM));
  const [loadingFormDetails, setLoadingFormDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [dimensionalParameters, setDimensionalParameters] = useState<any[]>([]);
  const [dimensionalParametersErrorMessage, setDimensionalParametersErrorMessage] = useState("");
  
  // Mapping API subdepartment dynamically via user routing slug
  const listParams = useSubdepartmentBatches("rocket-motor");
  
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [draftConfirm, setDraftConfirm] = useState(false);

  const showAlert = useAlertStore.getState().showAlert;
  const user = useAuthStore((s) => s.user);
  const bumpBatchRefresh = useUserBatchRefreshStore((s) => s.bumpVersion);
  const { fetchDimensionalParameters, isLoading: isDimensionalParamsLoading } = useDimensionalParametersHook();

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "rocket-motor")
        ?.subDepartmentId,
    [user]
  );

  const isFormDirty = useMemo(
    () => serializeForm(formData) !== initialSnapshot,
    [formData, initialSnapshot]
  );

  const resetFormContext = () => {
    setView("list");
    setActiveBatch(null);
    setIsEditMode(false);
    setFormData(INITIAL_ROCKET_FORM);
    setInitialSnapshot(serializeForm(INITIAL_ROCKET_FORM));
    setLoadingFormDetails(false);
    setActionLoading(false);
    setBackConfirmOpen(false);
    setDraftConfirm(false);
    setSubmitConfirm(false);
    setDimensionalParameters([]);
    setDimensionalParametersErrorMessage("");
    setHasSavedDraft(false);
  };

  const alignDimensionalDataWithParameters = (params: any[], currentRows: any[]) => {
    if (!params.length) return currentRows ?? [];

    const existingByParamId = new Map(
      (currentRows ?? [])
        .filter((row: any) => row?.paramId)
        .map((row: any) => [row.paramId, row])
    );

    return params.map((param: any, idx: number) => {
      const byId = existingByParamId.get(param.paramId);
      const byIndex = currentRows?.[idx] ?? {};
      const source = byId ?? byIndex ?? {};

      return {
        ...source,
        paramId: param.paramId,
        paramName: param.paramName,
        referenceRange: param.referenceRange,
        tb: source.tb ?? "",
        rl: source.rl ?? "",
        tlbr: source.tlbr ?? "",
        trbl: source.trbl ?? "",
        remarks: source.remarks ?? "",
      };
    });
  };

  const resolveCasingErrorMessage = (response: any, fallback: string) => {
    if (response?.statusCode === 409 && response?.errorCode === "FORM_ALREADY_EXISTS") {
      return STRINGS.SOURCING.CASING_FORM.FORM_ALREADY_EXISTS;
    }
    if (response?.statusCode === 409 && response?.errorCode === "INVALID_STATE_UPDATE") {
      return STRINGS.SOURCING.CASING_FORM.INVALID_STATE_UPDATE;
    }
    if (response?.statusCode === 422 && response?.errorCode === "INVALID_PARAM_ID") {
      return STRINGS.SOURCING.CASING_FORM.INVALID_PARAM_ID;
    }
    if (response?.statusCode === 404 && response?.errorCode === "FORM_NOT_FOUND") {
      return STRINGS.SOURCING.CASING_FORM.FORM_NOT_FOUND;
    }
    return response?.message || fallback;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMediaChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, mediaFilePath: file }));
  };

  const handleDimChange = (paramIdx: number, colKey: string, value: string) => {
    setFormData((prev) => {
      const updatedDimensionalData = [...(prev.dimensionalData || [])];
      updatedDimensionalData[paramIdx] = { ...(updatedDimensionalData[paramIdx] || {}), [colKey]: value };
      return { ...prev, dimensionalData: updatedDimensionalData };
    });
  };

  const openForm = async (batch: RocketMotorBatch, editMode: boolean) => {
    const shouldFetchDetails =
      editMode ||
      batch.rmStatus === SOURCING_STATUS.IN_PROGRESS ||
      batch.rmStatus === SOURCING_STATUS.REJECTED;

    let resolvedFormData = getStartingFormData(batch);
    let resolvedBatch = { ...batch };

    if (shouldFetchDetails) {
      if (!subDepartmentId) {
        showAlert(STRINGS.SOURCING.CASING_FORM.SUB_DEPARTMENT_MISSING, "error");
        return;
      }

      if (!batch.formId) {
        showAlert(STRINGS.SOURCING.CASING_FORM.FORM_ID_MISSING, "error");
        return;
      }

      setLoadingFormDetails(true);
      const detailsResponse = await rocketMotorCasingController.fetchFormDetails({
        formId: batch.formId,
        subDepartmentId,
      });
      setLoadingFormDetails(false);

      if (!detailsResponse?.success || !detailsResponse.data) {
        const fallback =
          detailsResponse?.statusCode === 404
            ? STRINGS.SOURCING.CASING_FORM.DETAILS_NOT_FOUND
            : STRINGS.SOURCING.CASING_FORM.DETAILS_FETCH_ERROR;
        showAlert(resolveCasingErrorMessage(detailsResponse, fallback), "error");
        return;
      }

      resolvedFormData = RocketMotorCasingDetailsModel.toFormData(detailsResponse.data);
      resolvedBatch = {
        ...resolvedBatch,
        formId: detailsResponse.data.formId || resolvedBatch.formId,
        motorType: detailsResponse.data.motorType || resolvedBatch.motorType,
        draftData: resolvedFormData,
      };
    }

    const { parameters, errorMessage } = await fetchDimensionalParameters(resolvedBatch.motorType || "");
    setDimensionalParameters(parameters);
    setDimensionalParametersErrorMessage(errorMessage ?? "");

    if (parameters.length) {
      resolvedFormData = {
        ...resolvedFormData,
        dimensionalData: alignDimensionalDataWithParameters(parameters, resolvedFormData.dimensionalData),
      };
    }

    setActiveBatch(resolvedBatch);
    setIsEditMode(editMode);
    setFormData(resolvedFormData);
    setInitialSnapshot(serializeForm(resolvedFormData));
    setView("form");
  };

  const handleFillForm = async (batch: RocketMotorBatch) => openForm(batch, false);
  const handleEditForm = async (batch: RocketMotorBatch) => openForm(batch, true);

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

  const submitCasingForm = async (intent: "draft" | "submit") => {
    if (!activeBatch) return false;

    if (!subDepartmentId) {
      showAlert(STRINGS.SOURCING.CASING_FORM.SUB_DEPARTMENT_MISSING, "error");
      return false;
    }

    const casingDetails = mapRocketFormToCasingPayload(formData, activeBatch.motorType || "");
    const isCreateFlow = activeBatch.rmStatus === SOURCING_STATUS.INITIATED && !activeBatch.formId;

    setActionLoading(true);
    try {
      let response;

      if (isCreateFlow) {
        if (!activeBatch.batchId) {
          showAlert(STRINGS.SOURCING.CASING_FORM.BATCH_ID_MISSING, "error");
          return false;
        }

        response = await rocketMotorCasingController.createForm({
          batchId: activeBatch.batchId,
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "SUBMIT",
          casingDetails,
        });
      } else {
        if (!activeBatch.formId) {
          showAlert(STRINGS.SOURCING.CASING_FORM.FORM_ID_MISSING, "error");
          return false;
        }

        response = await rocketMotorCasingController.updateForm({
          formId: activeBatch.formId,
          subDepartmentId,
          formSubmissionType: intent === "draft" ? "DRAFT" : "UPDATE",
          casingDetails,
        });
      }

      if (!response?.success) {
        const fallback = isCreateFlow
          ? STRINGS.SOURCING.CASING_FORM.CREATE_FAILED
          : STRINGS.SOURCING.CASING_FORM.UPDATE_FAILED;
        showAlert(resolveCasingErrorMessage(response, fallback), "error");
        return false;
      }

      const nextFormId = response.data?.formId ?? activeBatch.formId ?? null;
      setActiveBatch((prev) => (prev ? { ...prev, formId: nextFormId, draftData: formData } : prev));
      setInitialSnapshot(serializeForm(formData));

      if (intent === "draft") {
        showAlert(
          isCreateFlow
            ? STRINGS.SOURCING.CASING_FORM.CREATE_DRAFT_SUCCESS
            : STRINGS.SOURCING.CASING_FORM.UPDATE_DRAFT_SUCCESS,
          "success",
          { autoCloseMs: 2200 }
        );
        setHasSavedDraft(true);
      } else {
        showAlert(
          isCreateFlow
            ? STRINGS.SOURCING.CASING_FORM.CREATE_SUBMIT_SUCCESS
            : STRINGS.SOURCING.CASING_FORM.UPDATE_SUBMIT_SUCCESS,
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

  const handleConfirmDraft = async () => {
    if (!activeBatch) return;

    setDraftConfirm(false);
    await submitCasingForm("draft");
  };

  const handleConfirmSubmit = async () => {
    if (!activeBatch) return;

    setSubmitConfirm(false);
    await submitCasingForm("submit");
  };

  return {
    view,
    activeBatch,
    isEditMode,
    formData,
    isFormDirty,
    loadingFormDetails,
    actionLoading,
    dimensionalParameters,
    dimensionalParametersErrorMessage,
    isDimensionalParamsLoading,
    backConfirmOpen,
    ...listParams, // provides batches, totalRecords, page, etc.
    submitConfirm,
    draftConfirm,
    setSubmitConfirm,
    setDraftConfirm,
    setBackConfirmOpen,
    handleChange,
    handleMediaChange,
    handleDimChange,
    handleFillForm,
    handleEditForm,
    handleBack,
    handleDiscardAndBack,
    handleConfirmDraft,
    handleConfirmSubmit,
  };
};

export default useRocketMotorCasingHook;
