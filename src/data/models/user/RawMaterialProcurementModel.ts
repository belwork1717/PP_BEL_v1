import { OPERATION_STATUS } from "../../../hooks/operationStatus";

/** Re-export for sourcing pages that previously imported from sourcingWorkflowData */
export const SOURCING_STATUS = OPERATION_STATUS;
export type SourcingStatus = (typeof OPERATION_STATUS)[keyof typeof OPERATION_STATUS];

export type LotCertificate = {
  fileName: string;
  fileUrl: string;
  certificateType: string;
};

export type SpecRow = {
  specificationCode?: string;
  specification: string;
  specificationName?: string;
  refRange: string;
  analysedResult: string;
  remarks: string;
  isOutOfRange?: boolean;
  referenceRange?: {
    minValue: number | null;
    maxValue: number | null;
    unit: string | null;
  };
};

export type MaterialBlock = {
  material: string;
  lotNo: string;
  supplyOrderNo?: string;
  receiptDate?: string;
  manufacturerName?: string;
  certificates?: LotCertificate[];
  rows: SpecRow[];
};

/** List row from POST …/lot-list */
export type RawMaterialLotListRow = {
  id: string | number;
  lotId: string;
  procurementId: string;
  materialCode: string;
  materialName: string;
  supplyOrderNo: string;
  receiptDate: string;
  manufacturerName: string;
  status: string;
  createdBy?: { id: string; fullName: string } | null;
  createdOn: string;
  rmStatus: string;
  formId?: string | null;
};

/** Synthetic + list row context for form shell (UserWorkflowFormHeader) */
export type RawMaterialFormBatch = {
  id: string | number;
  lotId: string | null;
  procurementId: string | null;
  formId?: string | null;
  batchId: string;
  batchType: string;
  motorId: string;
  motorType: string;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdOn: string;
  rmStatus: SourcingStatus;
  draftData: MaterialBlock[];
  rejectionReason: string | null;
};

export type RawMaterialProcurementSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

export type RawMaterialLotSpecificationPayload = {
  specificationCode: string;
  analysedResult: number | null;
  isOutOfRange: boolean;
  remarks: string;
};

export type RawMaterialLotCreatePayload = {
  lotId: string;
  specifications: RawMaterialLotSpecificationPayload[];
  certificates: LotCertificate[];
};

export type RawMaterialMaterialCreatePayload = {
  materialCode: string;
  supplyOrderNo: string;
  receiptDate: string;
  manufacturerName: string;
  lots: RawMaterialLotCreatePayload[];
};

export type RawMaterialCreateFormPayload = {
  subDepartmentId: number;
  submissionType: "DRAFT" | "SUBMIT";
  materials: RawMaterialMaterialCreatePayload[];
};

export type RawMaterialLotUpdatePayload = {
  lotId: string;
  submissionType: "DRAFT" | "UPDATE";
  subDepartmentId: number;
  supplyOrderNo: string;
  receiptDate: string;
  manufacturerName: string;
  materialCode: string;
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
  certificates: LotCertificate[];
};

export type RawMaterialLotListRequest = {
  subDepartmentId: number;
  page: number;
  limit: number;
  status?: string[];
  materialCode?: string[];
  manufacturerName?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
};

export type RawMaterialLotListPagination = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

export type RawMaterialLotListData = {
  statusCounts: Record<string, number>;
  lots: RawMaterialLotListRow[];
  pagination: RawMaterialLotListPagination;
};

export class RawMaterialProcurementSubmitResponseModel {
  formId: string;
  batchId: string;
  procurementId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; procurementId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.procurementId = payload.procurementId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): RawMaterialProcurementSubmitResponseModel {
    return new RawMaterialProcurementSubmitResponseModel(apiResponse?.data ?? {});
  }
}

/** Legacy batch-style details (multi-material) — kept for approver until migrated */
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
        specificationName: spec.specificationName,
        refRange: formatRefRange(spec.referenceRange),
        analysedResult:
          spec.analysedResult === null || spec.analysedResult === undefined
            ? ""
            : String(spec.analysedResult),
        remarks: spec.remarks ?? "",
        isOutOfRange: false,
        referenceRange: {
          minValue: spec.referenceRange?.minValue ?? null,
          maxValue: spec.referenceRange?.maxValue ?? null,
          unit: spec.referenceRange?.unit ?? null,
        },
      })),
    }));
  }
}

/** Single-lot POST …/form/details response */
export class RawMaterialLotDetailsModel {
  lotId: string;
  submissionType: string;
  subDepartmentId: number;
  supplyOrderNo: string;
  receiptDate: string;
  manufacturerName: string;
  materialCode: string;
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
  certificates: LotCertificate[];
  progressInsights?: Record<string, unknown>;
  qualityInsights?: Record<string, unknown>;
  workflowInsights?: {
    currentStatus?: string;
    rejectionReason?: string | null;
    approvalPending?: boolean;
    reworkRequired?: boolean;
    resubmissionCount?: number;
  };

  constructor(payload: any) {
    this.lotId = payload?.lotId ?? "";
    this.submissionType = payload?.submissionType ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.supplyOrderNo = payload?.supplyOrderNo ?? "";
    this.receiptDate = payload?.receiptDate ?? "";
    this.manufacturerName = payload?.manufacturerName ?? "";
    this.materialCode = payload?.materialCode ?? "";
    this.specifications = Array.isArray(payload?.specifications) ? payload.specifications : [];
    this.certificates = Array.isArray(payload?.certificates) ? payload.certificates : [];
    this.progressInsights = payload?.progressInsights;
    this.qualityInsights = payload?.qualityInsights;
    this.workflowInsights = payload?.workflowInsights;
  }

  static fromApi(apiResponse: any): RawMaterialLotDetailsModel {
    return new RawMaterialLotDetailsModel(apiResponse?.data ?? {});
  }

  static toMaterialBlocks(model: RawMaterialLotDetailsModel): MaterialBlock[] {
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

    return [
      {
        material: model.materialCode,
        lotNo: model.lotId,
        supplyOrderNo: model.supplyOrderNo,
        receiptDate: model.receiptDate,
        manufacturerName: model.manufacturerName,
        certificates: [...(model.certificates ?? [])],
        rows: (model.specifications ?? []).map((spec) => ({
          specificationCode: spec.specificationCode,
          specification: spec.specificationName,
          specificationName: spec.specificationName,
          refRange: formatRefRange(spec.referenceRange),
          analysedResult:
            spec.analysedResult === null || spec.analysedResult === undefined
              ? ""
              : String(spec.analysedResult),
          remarks: spec.remarks ?? "",
          isOutOfRange: false,
          referenceRange: {
            minValue: spec.referenceRange?.minValue ?? null,
            maxValue: spec.referenceRange?.maxValue ?? null,
            unit: spec.referenceRange?.unit ?? null,
          },
        })),
      },
    ];
  }
}

export function mapLotListApiRow(lot: any, index: number): RawMaterialLotListRow {
  const lotId = String(lot?.lotId ?? "");
  const id = lotId ? simpleHash(lotId) : index;
  const status = String(lot?.status ?? "");
  return {
    id,
    lotId,
    procurementId: String(lot?.procurementId ?? ""),
    materialCode: String(lot?.materialCode ?? ""),
    materialName: String(lot?.materialName ?? ""),
    supplyOrderNo: String(lot?.supplyOrderNo ?? ""),
    receiptDate: String(lot?.receiptDate ?? ""),
    manufacturerName: String(lot?.manufacturerName ?? ""),
    status,
    rmStatus: status,
    createdBy: lot?.createdBy ?? null,
    createdOn: String(lot?.createdOn ?? ""),
    formId: lot?.formId ?? null,
  };
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function lotListRowToFormBatch(row: RawMaterialLotListRow, draftData: MaterialBlock[]): RawMaterialFormBatch {
  return {
    id: row.id,
    lotId: row.lotId,
    procurementId: row.procurementId,
    formId: row.formId ?? null,
    batchId: row.procurementId || row.lotId,
    batchType: row.materialName || row.materialCode,
    motorId: row.materialCode,
    motorType: row.materialName,
    priority: "Medium",
    assignedTo: row.createdBy ? { fullName: row.createdBy.fullName } : null,
    createdOn: row.createdOn,
    rmStatus: row.rmStatus as SourcingStatus,
    draftData,
    rejectionReason: null,
  };
}

export function createEmptyFormBatch(): RawMaterialFormBatch {
  return {
    id: "new",
    lotId: null,
    procurementId: null,
    formId: null,
    batchId: "—",
    batchType: "",
    motorId: "—",
    motorType: "",
    priority: "Medium",
    assignedTo: null,
    createdOn: new Date().toISOString(),
    rmStatus: OPERATION_STATUS.INITIATED,
    draftData: [],
    rejectionReason: null,
  };
}

export function mapBlocksToCreateMaterials(blocks: MaterialBlock[]): RawMaterialMaterialCreatePayload[] {
  const byMaterial = new Map<string, MaterialBlock[]>();
  for (const b of blocks ?? []) {
    const code = (b.material ?? "").trim();
    if (!code) continue;
    if (!byMaterial.has(code)) byMaterial.set(code, []);
    byMaterial.get(code)!.push(b);
  }

  return Array.from(byMaterial.entries()).map(([materialCode, group]) => {
    const head = group[0];
    return {
      materialCode,
      supplyOrderNo: (head.supplyOrderNo ?? "").trim(),
      receiptDate: (head.receiptDate ?? "").trim(),
      manufacturerName: (head.manufacturerName ?? "").trim(),
      lots: group.map((block) => ({
        lotId: (block.lotNo ?? "").trim(),
        specifications: (block.rows ?? [])
          .filter((row) => (row.specificationCode ?? "").trim())
          .map((row) => ({
            specificationCode: (row.specificationCode ?? "").trim(),
            analysedResult:
              row.analysedResult === "" || row.analysedResult === null || row.analysedResult === undefined
                ? null
                : Number(row.analysedResult),
            isOutOfRange: Boolean(row.isOutOfRange),
            remarks: row.remarks ?? "",
          })),
        certificates: block.certificates ?? [],
      })),
    };
  });
}

export function mapFirstBlockToLotUpdatePayload(
  block: MaterialBlock,
  lotId: string,
  subDepartmentId: number,
  submissionType: "DRAFT" | "UPDATE"
): RawMaterialLotUpdatePayload {
  return {
    lotId,
    submissionType,
    subDepartmentId,
    supplyOrderNo: (block.supplyOrderNo ?? "").trim(),
    receiptDate: (block.receiptDate ?? "").trim(),
    manufacturerName: (block.manufacturerName ?? "").trim(),
    materialCode: (block.material ?? "").trim(),
    specifications: (block.rows ?? [])
      .filter((row) => (row.specificationCode ?? "").trim())
      .map((row) => ({
        specificationCode: (row.specificationCode ?? "").trim(),
        specificationName: (row.specificationName ?? row.specification ?? "").trim(),
        referenceRange: {
          minValue: row.referenceRange?.minValue ?? null,
          maxValue: row.referenceRange?.maxValue ?? null,
          unit: row.referenceRange?.unit ?? null,
        },
        analysedResult:
          row.analysedResult === "" || row.analysedResult === null || row.analysedResult === undefined
            ? null
            : Number(row.analysedResult),
        remarks: row.remarks ?? "",
        status: null,
      })),
    certificates: block.certificates ?? [],
  };
}

/** @deprecated legacy flat shape — use mapBlocksToCreateMaterials */
export const mapBlocksToMaterialsPayload = (blocks: MaterialBlock[]) => {
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
