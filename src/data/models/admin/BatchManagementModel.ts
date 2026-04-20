/* ─────────────────────────────────────────────────────────────────────────────
   BATCH MANAGEMENT MODELS
   Aligned to actual API request / response contracts.
───────────────────────────────────────────────────────────────────────────── */

import { icons } from "../../../app/theme";

/* ─────────────────────────────────────────────────────────────────────────────
   READ MODEL  —  BatchListItemModel
   Maps the batch object inside response.data.batches[] or response.data.batch
   to a flat, stable shape for table rows and detail views.

   API shape:
   {
     id, batchId, batchType, subBatchType,
     projectId, numberOfMotors, motorIds: [],
     motorType: { motorTypeId, motorTypeName },
     priority, systemManagerId,
     status, createdOn, createdBy: { id, name },
     updatedOn?, updatedBy?: { id, name },
     identificationSheet?: {...},
     objective?, articles?: []
   }
───────────────────────────────────────────────────────────────────────────── */
export class BatchListItemModel {
  id                  : string | null;
  batchId             : string;
  batchType           : string;
  subBatchType        : string | null;
  projectId           : string | null;
  numberOfMotors      : number;
  motorIds            : string[];
  motorType           : { motorTypeId: number | null; motorTypeName: string };
  priority            : string;
  systemManagerId     : string;

  // Flattened stage / department fields for easy table access
  department          : { departmentId: number | null; departmentName: string } | null;
  subDepartments      : { subDepartmentId: number; subDepartmentName: string }[];

  status              : string;
  createdOn           : string | null;
  createdBy           : { id: string; name: string } | null;
  updatedOn           : string | null;
  updatedBy           : { id: string; name: string } | null;
  
  // Implementation details (optional)
  identificationSheet : IdentificationSheet | null;
  objective           : string | null;
  articles            : string[];

  constructor(data: Record<string, any>) {
    this.id              = data.id              ?? null;
    this.batchId         = data.batchId         ?? "";
    this.batchType       = data.batchType       ?? "MAIN";
    this.subBatchType    = data.subBatchType    ?? null;
    this.projectId       = data.projectId       ?? null;
    this.numberOfMotors  = data.numberOfMotors  ?? 0;
    this.motorIds        = Array.isArray(data.motorIds) ? data.motorIds : [];
    this.priority        = data.priority        ?? "Medium";
    this.systemManagerId = data.systemManagerId ?? "";
    this.status          = data.status          ?? "Initiated";
    
    // motorType — object in API, defensive fallback for missing data
    this.motorType = data.motorType
      ? {
          motorTypeId  : data.motorType.motorTypeId   ?? null,
          motorTypeName: data.motorType.motorTypeName ?? "",
        }
      : { motorTypeId: null, motorTypeName: "" };

    // stage → department (nested in API response)
    const dept = data.stage?.department ?? null;
    this.department = dept
      ? { departmentId: dept.departmentId ?? null, departmentName: dept.departmentName ?? "" }
      : null;

    // The API may return either subDepartments or legacy subDepartment.
    const nestedSubDepartments = Array.isArray(dept?.subDepartments)
      ? dept.subDepartments
      : Array.isArray(dept?.subDepartment)
        ? dept.subDepartment
        : [];

    this.subDepartments = nestedSubDepartments.length > 0
      ? nestedSubDepartments.map((sd: any) => ({
          subDepartmentId  : sd.subDepartmentId,
          subDepartmentName: sd.subDepartmentName ?? "",
        }))
      : [];

    // Audit fields
    this.createdOn = data.createdOn ?? null;
    this.createdBy = data.createdBy
      ? { id: data.createdBy.id ?? "", name: data.createdBy.name ?? "" }
      : null;

    // updatedOn / updatedBy only present in the detail endpoint response
    this.updatedOn = data.updatedOn ?? null;
    this.updatedBy = data.updatedBy
      ? { id: data.updatedBy.id ?? "", name: data.updatedBy.name ?? "" }
      : null;

    // Implementation details (optional)
    this.identificationSheet = data.identificationSheet ?? null;
    this.objective           = data.objective ?? null;
    this.articles            = Array.isArray(data.articles) ? data.articles : [];
  }

  static fromApi(data: Record<string, any>) {
    return new BatchListItemModel(data);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   IDENTIFICATION SHEET MODELS
───────────────────────────────────────────────────────────────────────────── */

export interface MaterialItem {
  srNo                : number;
  materialCode        : string;
  lotId               : string;
  make                : string;
  requiredComposition : number;
  quantityPerPremix   : number;
  revalidationDate    : string;
}

export interface IdentificationSheet {
  date              : string;
  batchSize         : number;
  bondingSheetNo    : string;
  mixerDetails      : string;
  numberOfPremix    : number;
  remarks?          : string;
  materials         : MaterialItem[];
}

/* ─────────────────────────────────────────────────────────────────────────────
   WRITE MODELS — CreateBatchPayload / UpdateBatchPayload
   Updated to support the new two-step batch creation workflow.
   Step 1: Create batch with basic details (identificationSheet is optional)
   Step 2: Update batch with implementation details (identificationSheet)
───────────────────────────────────────────────────────────────────────────── */

export interface BatchWritePayload {
  batchType           : string;
  subBatchType?       : string;
  projectId?          : string;
  motorType           : { motorTypeId: number; motorTypeName: string };
  numberOfMotors      : number;
  motorIds            : string[];
  priority            : string;
  systemManagerId     : string;
  identificationSheet?: IdentificationSheet;
  objective?          : string;
  articles?           : string[];
}

/**
 * Write model — used when POSTing a new batch (Step 1).
 * identificationSheet is optional in create API.
 * Controller builds this from raw form values.
 */
export class CreateBatchPayload implements BatchWritePayload {
  batchType           : string;
  subBatchType?       : string;
  projectId?          : string;
  motorType           : { motorTypeId: number; motorTypeName: string };
  numberOfMotors      : number;
  motorIds            : string[];
  priority            : string;
  systemManagerId     : string;
  identificationSheet?: IdentificationSheet;
  objective?          : string;
  articles?           : string[];

  constructor(form: Record<string, any>) {
    this.batchType         = form.batchType           ?? "MAIN";
    this.subBatchType      = form.subBatchType        ?? undefined;
    this.projectId         = form.projectId           ?? undefined;
    this.motorType         = {
      motorTypeId  : form.motorType?.motorTypeId   ?? 0,
      motorTypeName: form.motorType?.motorTypeName ?? "",
    };
    this.numberOfMotors    = form.numberOfMotors      ?? 0;
    this.motorIds          = Array.isArray(form.motorIds) ? form.motorIds : (form.motorIds ? [form.motorIds] : []);
    this.priority          = form.priority            ?? "Medium";
    this.systemManagerId   = String(form.systemManagerId ?? "").trim();
    this.identificationSheet = form.identificationSheet ?? undefined;
    this.objective         = form.objective           ?? undefined;
    this.articles          = Array.isArray(form.articles) ? form.articles : undefined;
  }
}

/**
 * Write model — used when PUTting an updated batch (Step 2 - Implementation Details).
 * Used to update the batch with identificationSheet and other implementation details.
 */
export class UpdateBatchPayload implements BatchWritePayload {
  batchType           : string;
  subBatchType?       : string;
  projectId?          : string;
  motorType           : { motorTypeId: number; motorTypeName: string };
  numberOfMotors      : number;
  motorIds            : string[];
  priority            : string;
  systemManagerId     : string;
  identificationSheet?: IdentificationSheet;
  objective?          : string;
  articles?           : string[];

  constructor(form: Record<string, any>) {
    this.batchType         = form.batchType           ?? "MAIN";
    this.subBatchType      = form.subBatchType        ?? undefined;
    this.projectId         = form.projectId           ?? undefined;
    this.motorType         = {
      motorTypeId  : form.motorType?.motorTypeId   ?? 0,
      motorTypeName: form.motorType?.motorTypeName ?? "",
    };
    this.numberOfMotors    = form.numberOfMotors      ?? 0;
    this.motorIds          = Array.isArray(form.motorIds) ? form.motorIds : (form.motorIds ? [form.motorIds] : []);
    this.priority          = form.priority            ?? "Medium";
    this.systemManagerId   = String(form.systemManagerId ?? "").trim();
    this.identificationSheet = form.identificationSheet ?? undefined;
    this.objective         = form.objective           ?? undefined;
    this.articles          = Array.isArray(form.articles) ? form.articles : undefined;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   BATCH STATISTICS MODEL
───────────────────────────────────────────────────────────────────────────── */

const STAT_CONFIG = {
  totalBatches     : { label: "Total Batches",      variant: "total",      icon: icons.batchMgmt.batchIcon },
  inProgressBatches: { label: "In Progress",        variant: "inProgress", icon: icons.batchMgmt.inProgressStatus },
  completedBatches : { label: "Completed",          variant: "completed",  icon: icons.batchMgmt.completedStatus },
  pendingApprovals : { label: "Pending Approvals",  variant: "pending",    icon: icons.batchMgmt.pendingStatus },
  rejectedBatches  : { label: "Rejected",           variant: "rejected",   icon: icons.batchMgmt.rejectedStatus },
};

export class BatchStatsModel {
  static fromStatsApi(apiResponse: any) {
    const { data } = apiResponse;
    if (!data) return [];

    return Object.entries(STAT_CONFIG).map(([apiKey, config]) => {
      const statData = (data as any)[apiKey] || { count: 0, subValue: 0 };

      return {
        label   : config.label,
        value   : BatchStatsModel.formatNumber(statData.count),
        rawValue: statData.count,
        subLabel: statData.subValue !== 0
          ? (statData.subValue > 0
              ? `+${statData.subValue} this period`
              : `${statData.subValue} this period`)
          : "",
        icon   : config.icon,
        variant: config.variant,
      };
    });
  }

  static formatNumber(num: number): string {
    if (num === null || num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}