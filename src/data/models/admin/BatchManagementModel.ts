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
     id, batchId, motorId,
     motorType: { motorTypeId, motorTypeName },
     projectName, batchType, priority,
     systemManager: { id, name },
    stage: { department: { departmentId, departmentName, subDepartments: [{ subDepartmentId, subDepartmentName }] } },
     status, createdOn, createdBy: { id, name },
     updatedOn?, updatedBy?: { id, name }          ← detail endpoint only
   }
───────────────────────────────────────────────────────────────────────────── */
export class BatchListItemModel {
  id           : string | null;
  batchId      : string;
  motorId      : string;
  motorType    : { motorTypeId: number | null; motorTypeName: string };
  projectName  : string;
  batchType    : string;
  priority     : string;
  systemManager: { id: string; name: string } | null;

  // Flattened stage / department fields for easy table access
  department   : { departmentId: number | null; departmentName: string } | null;
  subDepartments: { subDepartmentId: number; subDepartmentName: string }[];

  status    : string;
  createdOn : string | null;
  createdBy : { id: string; name: string } | null;
  updatedOn : string | null;
  updatedBy : { id: string; name: string } | null;

  constructor(data: Record<string, any>) {
    this.id          = data.id          ?? null;
    this.batchId     = data.batchId     ?? "";
    this.motorId     = data.motorId     ?? "";
    this.projectName = data.projectName ?? "";
    this.batchType   = data.batchType   ?? "";
    this.priority    = data.priority    ?? "Medium";
    this.status      = data.status      ?? "Pending";

    // motorType — object in API, defensive fallback for missing data
    this.motorType = data.motorType
      ? {
          motorTypeId  : data.motorType.motorTypeId   ?? null,
          motorTypeName: data.motorType.motorTypeName ?? "",
        }
      : { motorTypeId: null, motorTypeName: "" };

    // systemManager
    this.systemManager = data.systemManager
      ? { id: data.systemManager.id ?? "", name: data.systemManager.name ?? "" }
      : null;

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
  }

  static fromApi(data: Record<string, any>) {
    return new BatchListItemModel(data);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   WRITE MODELS — CreateBatchPayload / UpdateBatchPayload
   Both share the same request body shape per the API contracts.
   createdBy / updatedBy are derived server-side from the auth token,
   so they are NOT included in the outgoing payload.
───────────────────────────────────────────────────────────────────────────── */

export interface BatchWritePayload {
  batchId      : string;
  motorId      : string;
  motorType    : { motorTypeId: number; motorTypeName: string };
  projectName  : string;
  batchType    : string;
  priority     : string;
  systemManager: { id: string; name: string };
}

/**
 * Write model — used when POSTing a new batch.
 * Controller builds this from raw form values.
 */
export class CreateBatchPayload implements BatchWritePayload {
  batchId      : string;
  motorId      : string;
  motorType    : { motorTypeId: number; motorTypeName: string };
  projectName  : string;
  batchType    : string;
  priority     : string;
  systemManager: { id: string; name: string };

  constructor(form: Record<string, any>) {
    this.batchId       = String(form.batchId      ?? "").trim();
    this.motorId       = String(form.motorId       ?? "").trim();
    this.motorType     = {
      motorTypeId  : form.motorType?.motorTypeId   ?? 0,
      motorTypeName: form.motorType?.motorTypeName ?? "",
    };
    this.projectName   = String(form.projectName  ?? "").trim();
    this.batchType     = form.batchType            ?? "";
    this.priority      = form.priority             ?? "Medium";
    this.systemManager = {
      id  : form.systemManager?.id   ?? "",
      name: form.systemManager?.name ?? "",
    };
  }
}

/**
 * Write model — used when PUTting an updated batch.
 * Identical fields to CreateBatchPayload (same API contract shape).
 */
export class UpdateBatchPayload implements BatchWritePayload {
  batchId      : string;
  motorId      : string;
  motorType    : { motorTypeId: number; motorTypeName: string };
  projectName  : string;
  batchType    : string;
  priority     : string;
  systemManager: { id: string; name: string };

  constructor(form: Record<string, any>) {
    this.batchId       = String(form.batchId      ?? "").trim();
    this.motorId       = String(form.motorId       ?? "").trim();
    this.motorType     = {
      motorTypeId  : form.motorType?.motorTypeId   ?? 0,
      motorTypeName: form.motorType?.motorTypeName ?? "",
    };
    this.projectName   = String(form.projectName  ?? "").trim();
    this.batchType     = form.batchType            ?? "";
    this.priority      = form.priority             ?? "Medium";
    this.systemManager = {
      id  : form.systemManager?.id   ?? "",
      name: form.systemManager?.name ?? "",
    };
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