import { INITIAL_ROCKET_FORM, RocketFormData } from "../../../hooks/user/sourcing/sourcingWorkflowData";

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

export class RocketMotorCasingSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): RocketMotorCasingSubmitResponseModel {
    return new RocketMotorCasingSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class RocketMotorCasingDetailsModel {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  motorType: string;
  formSubmissionType: string;
  casingDetails: {
    motorIdDetails: string;
    motorIdRemarks: string;
    motorClearanceDetails: string;
    motorClearanceRemarks: string;
    tensileStrengthDetails: string;
    tensileStrengthRemarks: string;
    elongationDetails: string;
    elongationRemarks: string;
    erosionRateDetails: string;
    erosionRateRemarks: string;
    thermalConductivityDetails: string;
    thermalConductivityRemarks: string;
    utNdtDetails: string;
    utNdtRemarks: string;
    waiversDetails: string;
    waiversRemarks: string;
    mediaFilePath: File | null;
    dimensionalData: DimensionalRow[];
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.motorType = payload?.motorType ?? "";
    this.formSubmissionType = payload?.formSubmissionType ?? "";
    this.casingDetails = {
      ...INITIAL_ROCKET_FORM,
      ...(payload?.casingDetails ?? {}),
      mediaFilePath: null,
      dimensionalData: Array.isArray(payload?.casingDetails?.dimensionalData)
        ? payload.casingDetails.dimensionalData
        : [],
    };
  }

  static fromApi(apiResponse: any): RocketMotorCasingDetailsModel {
    return new RocketMotorCasingDetailsModel(apiResponse?.data ?? {});
  }

  static toFormData(model: RocketMotorCasingDetailsModel): RocketFormData {
    return {
      ...INITIAL_ROCKET_FORM,
      ...model.casingDetails,
      mediaFilePath: null,
      dimensionalData: (model.casingDetails?.dimensionalData ?? []).map((row) => ({
        paramId: row.paramId ?? "",
        paramName: row.paramName ?? "",
        referenceRange: row.referenceRange,
        status: row.status ?? null,
        tb: row.tb ?? "",
        rl: row.rl ?? "",
        tlbr: row.tlbr ?? "",
        trbl: row.trbl ?? "",
        remarks: row.remarks ?? "",
      })),
    };
  }
}

const toThreeDigit = (n: number) => String(n).padStart(3, "0");

const resolveParamId = (row: any, idx: number, motorType: string) => {
  if (row?.paramId) return row.paramId;
  if (!motorType) return `DIM-UNK-${toThreeDigit(idx + 1)}`;
  return `DIM-${motorType}-${toThreeDigit(idx + 1)}`;
};

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
