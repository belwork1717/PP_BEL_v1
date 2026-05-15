import { INITIAL_ROCKET_FORM, RocketFormData } from "../../../hooks/user/sourcing/sourcingWorkflowData";
import { OPERATION_STATUS, type OperationStatus } from "../../../hooks/operationStatus";

type DimensionalRow = {
  paramId?: string;
  paramName?: string;
  referenceRange?: {
    minValue: number | null;
    maxValue: number | null;
    unit: string | null;
  };
  tb?: string | null;
  rl?: string | null;
  tlbr?: string | null;
  trbl?: string | null;
  remarks?: string;
  status?: string | null;
};

const OPERATION_STATUS_VALUES = Object.values(OPERATION_STATUS) as OperationStatus[];

/** API status enum → UI status labels */
export function normalizeRocketCasingListStatus(status: string): OperationStatus {
  const u = String(status ?? "").toUpperCase();
  const map: Record<string, OperationStatus> = {
    INITIATED: OPERATION_STATUS.INITIATED,
    IN_PROGRESS: OPERATION_STATUS.IN_PROGRESS,
    WAITING_FOR_APPROVAL: OPERATION_STATUS.WAITING_FOR_APPROVAL,
    APPROVED: OPERATION_STATUS.APPROVED,
    REJECTED: OPERATION_STATUS.REJECTED,
  };
  const fromApiKey = map[u];
  if (fromApiKey) return fromApiKey;
  const trimmed = String(status ?? "").trim();
  if (OPERATION_STATUS_VALUES.includes(trimmed as OperationStatus)) {
    return trimmed as OperationStatus;
  }
  return OPERATION_STATUS.INITIATED;
}

export class RocketMotorCasingSubmitResponseModel {
  formId: string;
  procurementId: string;
  motorCasingId: string;
  status: string;
  nextStep: string;
  /** Legacy alias used by older UI */
  batchId: string;

  constructor(payload: {
    formId?: string;
    procurementId?: string;
    motorCasingId?: string;
    status?: string;
    nextStep?: string;
  }) {
    this.formId = payload?.formId ?? "";
    this.procurementId = payload?.procurementId ?? "";
    this.motorCasingId = payload?.motorCasingId ?? "";
    this.status = payload?.status ?? "";
    this.nextStep = payload?.nextStep ?? "";
    this.batchId = payload?.procurementId || payload?.formId || "";
  }

  static fromApi(apiResponse: any): RocketMotorCasingSubmitResponseModel {
    return new RocketMotorCasingSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class RocketMotorCasingDetailsModel {
  subDepartmentId: number;
  motorStage: string;
  motorNo: string;
  motorCasingId: string;
  status: string;
  sections: Record<string, unknown>;

  constructor(payload: any) {
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.motorStage = String(payload?.motorStage ?? "");
    this.motorNo = String(payload?.motorNo ?? "");
    this.motorCasingId = String(payload?.motorCasingId ?? "");
    this.status = String(payload?.status ?? "");
    this.sections = (payload?.sections && typeof payload.sections === "object" ? payload.sections : {}) as Record<
      string,
      unknown
    >;
  }

  static fromApi(apiResponse: any): RocketMotorCasingDetailsModel {
    return new RocketMotorCasingDetailsModel(apiResponse?.data ?? {});
  }

  static toFormData(model: RocketMotorCasingDetailsModel): RocketFormData {
    return mergeApiSectionsIntoFormData(model.sections, {
      motorStage: model.motorStage,
      motorNo: model.motorNo,
      motorCasingId: model.motorCasingId,
    });
  }
}

const parseNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const firstMech = (sections: Record<string, unknown>, name: string) => {
  const mr = sections.motorReceipt as Record<string, unknown> | undefined;
  const ins = mr?.insulation as Record<string, unknown> | undefined;
  const arr = ins?.mechanicalProperties as Array<Record<string, unknown>> | undefined;
  const row = (arr ?? []).find((r) => String(r?.paramName ?? "").toLowerCase().includes(name.toLowerCase()));
  return row;
};

export function mergeApiSectionsIntoFormData(
  sections: Record<string, unknown>,
  ids: { motorStage?: string; motorNo?: string; motorCasingId?: string }
): RocketFormData {
  const mr = (sections.motorReceipt ?? {}) as Record<string, unknown>;
  const items = (mr.itemsReceived ?? {}) as Record<string, unknown>;
  const clear = (mr.clearances ?? {}) as Record<string, unknown>;
  const ins = (mr.insulation ?? {}) as Record<string, unknown>;
  const thermal = (ins.thermalProperties ?? {}) as Record<string, unknown>;
  const tc = (thermal.thermalConductivity ?? {}) as Record<string, unknown>;
  const ar = (thermal.ablationRate ?? {}) as Record<string, unknown>;

  const ts = firstMech(sections, "tensile");
  const el = firstMech(sections, "elongation");

  const dimApi = Array.isArray(sections.dimensionalInspection) ? sections.dimensionalInspection : [];
  const dimensionalData: DimensionalRow[] = dimApi.map((d: any) => ({
    paramId: String(d?.paramId ?? ""),
    paramName: "",
    tb: d?.recordedValue != null ? String(d.recordedValue) : "",
    rl: "",
    tlbr: "",
    trbl: "",
    remarks: d?.isWithinRange === false ? "Out of range" : "",
    referenceRange: { minValue: null, maxValue: null, unit: d?.unit ?? null },
  }));

  const wm = (sections.weightment ?? {}) as Record<string, unknown>;
  const wwh = (wm.weightWithoutHarness ?? {}) as Record<string, unknown>;
  const wwh2 = (wm.weightWithHarness ?? {}) as Record<string, unknown>;

  const visual = Array.isArray(sections.visualInspection) ? sections.visualInspection : [];
  const firstVis = visual[0] as Record<string, unknown> | undefined;
  const mediaRef = firstVis?.media != null ? String(firstVis.media) : null;

  return {
    ...INITIAL_ROCKET_FORM,
    motorCasingId: ids.motorCasingId ?? "",
    motorStageApi: ids.motorStage ?? "",
    motorNoApi: ids.motorNo ?? "",
    casingType: String(mr.casingType ?? "COMPOSITE"),
    receivingDate: String(mr.receivingDate ?? "").slice(0, 10),
    itemsDescription: String(items.description ?? ""),
    itemsDimension: String(items.dimension ?? ""),
    itemsUnit: String(items.unit ?? "mm"),
    greenCardNo: String(clear.greenCardNo ?? ""),
    clearanceAuthority: String(clear.authority ?? ""),
    clearanceStatus: String(clear.status ?? "RECEIVED"),
    insulationType: String(ins.type ?? "ROCASIN"),
    insulationReportNo: String(ins.reportNo ?? ""),
    weightWithoutHarness: wwh.value != null ? String(wwh.value) : "",
    weightWithHarness: wwh2.value != null ? String(wwh2.value) : "",
    calibrationRef: String(wm.calibrationRef ?? ""),
    motorIdDetails: String(items.description ?? INITIAL_ROCKET_FORM.motorIdDetails),
    motorIdRemarks: INITIAL_ROCKET_FORM.motorIdRemarks,
    motorClearanceDetails: String(clear.greenCardNo ?? INITIAL_ROCKET_FORM.motorClearanceDetails),
    motorClearanceRemarks: INITIAL_ROCKET_FORM.motorClearanceRemarks,
    tensileStrengthDetails: ts?.reported != null ? String(ts.reported) : INITIAL_ROCKET_FORM.tensileStrengthDetails,
    tensileStrengthRemarks: ts?.acem != null ? String(ts.acem) : INITIAL_ROCKET_FORM.tensileStrengthRemarks,
    elongationDetails: el?.reported != null ? String(el.reported) : INITIAL_ROCKET_FORM.elongationDetails,
    elongationRemarks: el?.acem != null ? String(el.acem) : INITIAL_ROCKET_FORM.elongationRemarks,
    erosionRateDetails: ar.value != null ? String(ar.value) : INITIAL_ROCKET_FORM.erosionRateDetails,
    erosionRateRemarks: String(ar.unit ?? INITIAL_ROCKET_FORM.erosionRateRemarks),
    thermalConductivityDetails: tc.value != null ? String(tc.value) : INITIAL_ROCKET_FORM.thermalConductivityDetails,
    thermalConductivityRemarks: String(tc.unit ?? INITIAL_ROCKET_FORM.thermalConductivityRemarks),
    utNdtDetails: INITIAL_ROCKET_FORM.utNdtDetails,
    utNdtRemarks: INITIAL_ROCKET_FORM.utNdtRemarks,
    waiversDetails: firstVis?.observation != null ? String(firstVis.observation) : INITIAL_ROCKET_FORM.waiversDetails,
    waiversRemarks: firstVis?.desc != null ? String(firstVis.desc) : INITIAL_ROCKET_FORM.waiversRemarks,
    mediaFilePath: mediaRef ?? INITIAL_ROCKET_FORM.mediaFilePath,
    dimensionalData,
  };
}

function mechanicalRowsFromForm(form: RocketFormData): Array<{ paramName: string; reported: number; acem: number; unit: string }> {
  const rows: Array<{ paramName: string; reported: number; acem: number; unit: string }> = [];
  const ts = parseNum(form.tensileStrengthDetails);
  const tsA = parseNum(form.tensileStrengthRemarks);
  if (ts != null) {
    rows.push({
      paramName: "Tensile strength",
      reported: ts,
      acem: tsA ?? ts,
      unit: "ksc",
    });
  }
  const el = parseNum(form.elongationDetails);
  const elA = parseNum(form.elongationRemarks);
  if (el != null) {
    rows.push({
      paramName: "Elongation",
      reported: el,
      acem: elA ?? el,
      unit: "%",
    });
  }
  return rows;
}

export function buildRocketMotorCasingSectionsPayload(
  formData: RocketFormData,
  dimensionalParameters: Array<{ paramId?: string; paramName?: string; referenceRange?: { unit?: string | null } }>,
  options?: { includeVisualInspection?: boolean }
): Record<string, unknown> {
  const casingType = (formData.casingType || "COMPOSITE").toUpperCase();
  const receivingDate =
    (formData.receivingDate || "").trim() || new Date().toISOString().slice(0, 10);
  const itemsDescription = (formData.itemsDescription || formData.motorIdDetails || "").trim() || "—";
  const itemsDimension = (formData.itemsDimension || "—").trim();
  const itemsUnit = (formData.itemsUnit || "mm").trim();

  const greenCardNo = (formData.greenCardNo || formData.motorClearanceDetails || "").trim() || "—";
  const authority = (formData.clearanceAuthority || "—").trim();
  const clearanceStatus = (formData.clearanceStatus || "RECEIVED").toUpperCase();

  const insulationType = (formData.insulationType || "ROCASIN").toUpperCase();
  const reportNo = (formData.insulationReportNo || "—").trim();

  const tcVal = parseNum(formData.thermalConductivityDetails) ?? 0;
  const tcUnit = (formData.thermalConductivityRemarks || "cal/cm/s/K").trim() || "cal/cm/s/K";
  const arVal = parseNum(formData.erosionRateDetails) ?? 0;
  const arUnit = (formData.erosionRateRemarks || "mm/s @ 300W/cm2").trim() || "mm/s @ 300W/cm2";

  const w1 = parseNum(formData.weightWithoutHarness) ?? 0;
  const w2 = parseNum(formData.weightWithHarness) ?? 0;

  const dimensionalInspection = (formData.dimensionalData ?? []).map((row: any, idx: number) => {
    const param = dimensionalParameters[idx];
    const paramId = String(row?.paramId || param?.paramId || `DIM-${idx + 1}`);
    const vals = [parseNum(row?.tb), parseNum(row?.rl), parseNum(row?.tlbr), parseNum(row?.trbl)].filter(
      (n): n is number => n != null
    );
    const recordedValue = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const unit = String(row?.referenceRange?.unit || param?.referenceRange?.unit || "mm");
    return {
      paramId,
      recordedValue,
      unit,
      isWithinRange: true,
    };
  });

  const mechanical = mechanicalRowsFromForm(formData);

  const motorReceipt = {
    casingType,
    receivingDate,
    itemsReceived: {
      description: itemsDescription,
      dimension: itemsDimension,
      unit: itemsUnit,
    },
    clearances: {
      greenCardNo,
      authority,
      status: clearanceStatus,
    },
    insulation: {
      type: insulationType,
      reportNo,
      ...(mechanical.length > 0 ? { mechanicalProperties: mechanical } : {}),
      thermalProperties: {
        thermalConductivity: { value: tcVal, unit: tcUnit },
        ablationRate: { value: arVal, unit: arUnit },
      },
    },
  };

  const weightment: Record<string, unknown> = {
    weightWithoutHarness: { value: w1, unit: "kg" },
    weightWithHarness: { value: w2, unit: "kg" },
  };
  const cal = (formData.calibrationRef || "").trim();
  if (cal) weightment.calibrationRef = cal;

  const sections: Record<string, unknown> = {
    motorReceipt,
    dimensionalInspection,
    weightment,
  };

  if (options?.includeVisualInspection) {
    const desc = (formData.waiversRemarks || "").trim() || "Visual inspection";
    const obs = (formData.waiversDetails || "").trim() || "—";
    const media =
      typeof formData.mediaFilePath === "string" && formData.mediaFilePath.trim()
        ? formData.mediaFilePath.trim()
        : formData.mediaFilePath && typeof formData.mediaFilePath === "object" && "name" in formData.mediaFilePath
          ? (formData.mediaFilePath as File).name
          : "pending-media-upload";
    sections.visualInspection = [{ desc, observation: obs, media }];
  }

  return sections;
}

const toThreeDigit = (n: number) => String(n).padStart(3, "0");

const resolveParamId = (row: any, idx: number, motorType: string) => {
  if (row?.paramId) return row.paramId;
  if (!motorType) return `DIM-UNK-${toThreeDigit(idx + 1)}`;
  return `DIM-${motorType}-${toThreeDigit(idx + 1)}`;
};

/** @deprecated Prefer buildRocketMotorCasingSectionsPayload for API v1 */
export const mapRocketFormToCasingPayload = (formData: RocketFormData, motorType: string) => {
  const targetCount = formData?.dimensionalData?.length ?? 0;
  const dimensionalData = Array.from({ length: targetCount }, (_, idx) => {
    const row = formData?.dimensionalData?.[idx] ?? {};

    return {
      paramId: resolveParamId(row, idx, motorType),
      tb: row?.tb ?? "",
      rl: row?.rl ?? "",
      tlbr: row?.tlbr ?? "",
      trbl: row?.trbl ?? "",
      remarks: row?.remarks ?? "",
    };
  });

  return {
    motorIdDetails: formData.motorIdDetails ?? "",
    motorIdRemarks: formData.motorIdRemarks ?? "",
    motorClearanceDetails: formData.motorClearanceDetails ?? "",
    motorClearanceRemarks: formData.motorClearanceRemarks ?? "",
    tensileStrengthDetails: formData.tensileStrengthDetails ?? "",
    tensileStrengthRemarks: formData.tensileStrengthRemarks ?? "",
    elongationDetails: formData.elongationDetails ?? "",
    elongationRemarks: formData.elongationRemarks ?? "",
    erosionRateDetails: formData.erosionRateDetails ?? "",
    erosionRateRemarks: formData.erosionRateRemarks ?? "",
    thermalConductivityDetails: formData.thermalConductivityDetails ?? "",
    thermalConductivityRemarks: formData.thermalConductivityRemarks ?? "",
    utNdtDetails: formData.utNdtDetails ?? "",
    utNdtRemarks: formData.utNdtRemarks ?? "",
    waiversDetails: formData.waiversDetails ?? "",
    waiversRemarks: formData.waiversRemarks ?? "",
    mediaFilePath:
      formData.mediaFilePath && typeof formData.mediaFilePath !== "string"
        ? formData.mediaFilePath.name
        : formData.mediaFilePath ?? null,
    dimensionalData,
  };
};
