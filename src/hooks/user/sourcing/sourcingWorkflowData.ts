import { OPERATION_STATUS } from "../../operationStatus";

export const SOURCING_STATUS = OPERATION_STATUS;

export type SourcingStatus = (typeof SOURCING_STATUS)[keyof typeof SOURCING_STATUS];

export type SpecRow = {
  specificationCode?: string;
  specification: string;
  refRange: string;
  analysedResult: string;
  remarks: string;
};

export type MaterialBlock = {
  material: string;
  lotNo: string;
  rows: SpecRow[];
};

export type RawMaterialBatch = {
  id: number;
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

export type RocketFormData = {
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
  dimensionalData: Array<Record<string, any>>;
};

export type RocketMotorBatch = {
  id: number;
  formId?: string | null;
  batchId: string;
  batchType: string;
  motorId: string;
  motorType: string;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdOn: string;
  rmStatus: SourcingStatus;
  draftData: RocketFormData | null;
  rejectionReason: string | null;
};

export const INITIAL_ROCKET_FORM: RocketFormData = {
  motorIdDetails: "",
  motorIdRemarks: "",
  motorClearanceDetails: "",
  motorClearanceRemarks: "",
  tensileStrengthDetails: "",
  tensileStrengthRemarks: "",
  elongationDetails: "",
  elongationRemarks: "",
  erosionRateDetails: "",
  erosionRateRemarks: "",
  thermalConductivityDetails: "",
  thermalConductivityRemarks: "",
  utNdtDetails: "",
  utNdtRemarks: "",
  waiversDetails: "",
  waiversRemarks: "",
  mediaFilePath: null,
  dimensionalData: [],
};

export const SUB_DEPT_LABELS: Record<string, string> = {
  "raw-material": "Raw Material Procurement",
  "rocket-motor": "Rocket Motor Casing",
};


