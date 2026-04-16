import { MaterialBlock } from "../../../hooks/user/sourcing/sourcingWorkflowData";

export type RawMaterialProcurementSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

export type RawMaterialSpecSubmission = {
  specificationCode: string;
  analysedResult: number | null;
  remarks: string;
};

export type RawMaterialItemSubmission = {
  materialCode: string;
  lotNo: string;
  specifications: RawMaterialSpecSubmission[];
};

export class RawMaterialProcurementSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): RawMaterialProcurementSubmitResponseModel {
    return new RawMaterialProcurementSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class RawMaterialProcurementDetailsModel {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  materials: Array<{
    materialCode: string;
    lotNo: string;
    specifications: Array<{
      specificationCode: string;
      specificationName: string;
      referenceRange: {
        minValue: number | null;
        maxValue: number | null;
        unit: string | null;
      };
      analysedResult: number | null;
      remarks: string;
      status: string | null;
    }>;
  }>;

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.materials = Array.isArray(payload?.materials) ? payload.materials : [];
  }

  static fromApi(apiResponse: any): RawMaterialProcurementDetailsModel {
    return new RawMaterialProcurementDetailsModel(apiResponse?.data ?? {});
  }

  static toMaterialBlocks(model: RawMaterialProcurementDetailsModel): MaterialBlock[] {
    const formatRefRange = (ref: {
      minValue: number | null;
      maxValue: number | null;
      unit: string | null;
    }) => {
      const unitSuffix = ref?.unit ? ` ${ref.unit}` : "";
      if (ref?.minValue != null && ref?.maxValue != null) {
        return `${ref.minValue} - ${ref.maxValue}${unitSuffix}`;
      }
      if (ref?.minValue != null) {
        return `>= ${ref.minValue}${unitSuffix}`;
      }
      if (ref?.maxValue != null) {
        return `<= ${ref.maxValue}${unitSuffix}`;
      }
      return "N/A";
    };

    return model.materials.map((material) => ({
      material: material.materialCode,
      lotNo: material.lotNo ?? "",
      rows: (material.specifications ?? []).map((spec) => ({
        specificationCode: spec.specificationCode,
        specification: spec.specificationName,
        refRange: formatRefRange(spec.referenceRange),
        analysedResult:
          spec.analysedResult === null || spec.analysedResult === undefined
            ? ""
            : String(spec.analysedResult),
        remarks: spec.remarks ?? "",
      })),
    }));
  }
}

export const mapBlocksToMaterialsPayload = (blocks: MaterialBlock[]): RawMaterialItemSubmission[] => {
  return (blocks ?? []).map((block) => ({
    materialCode: block.material,
    lotNo: block.lotNo ?? "",
    specifications: (block.rows ?? []).map((row) => ({
      specificationCode: row.specificationCode ?? "",
      analysedResult:
        row.analysedResult === "" || row.analysedResult === null || row.analysedResult === undefined
          ? null
          : Number(row.analysedResult),
      remarks: row.remarks ?? "",
    })),
  }));
};
