/**
 * BatchConfigs.tsx
 *
 * Pure data-accessor helpers for the Batch Management module.
 * Visual style configs (stageConfig, statusConfig, priorityConfig, getDeptConfig)
 * now live in batchManagement_theme.ts and are re-exported here for
 * backwards compatibility.
 */

// Re-export style configs from their canonical home in the theme
export {
  stageConfig,
  statusConfig,
  priorityConfig,
  getDeptConfig,
} from "../../../../../../app/theme/custom_themes/admin/batchManagement_theme";

// ── Pure field accessor helpers ──────────────────────────────────────────────
// These are aligned to the actual BatchListItemModel shape returned by the controller.

export const getBatchId    = (b: any): string => b.batchId     || b.id        || "—";
export const getMotorId    = (b: any): string => b.motorId     || "—";
/** motorType is an object { motorTypeId, motorTypeName } in the model */
export const getMotorType  = (b: any): string =>
  b.motorType?.motorTypeName ?? (typeof b.motorType === "string" ? b.motorType : "—");
/** stage is not a flat string; the stage department is in b.department.departmentName */
export const getStage      = (b: any): string => b.department?.departmentName || "—";
export const getStatus     = (b: any): string => b.status      || "Pending";
export const getPriority   = (b: any): string => b.priority    || "Medium";
/** top-level department object */
export const getDept       = (b: any): string => b.department?.departmentName || "—";
/** first sub-department name, or the API's subDepartment string */
export const getSubDept    = (b: any): string => {
  if (Array.isArray(b.subDepartments) && b.subDepartments.length > 0) {
    return b.subDepartments[0]?.subDepartmentName || "—";
  }
  return b.subDepartment || b.subDept || "—";
};
/** systemManager is { id, name } in the model */
export const getAssignedTo = (b: any) => b.systemManager ?? null;
export const getCreatedOn  = (b: any) => b.createdOn     || b.createdAt  || null;
export const getCreatedBy  = (b: any) => b.createdBy     ?? null;
export const getNotes      = (b: any): string => b.notes || b.description || "";