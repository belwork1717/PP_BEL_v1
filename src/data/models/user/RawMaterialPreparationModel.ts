import { SOLID_PROCESSES } from "../../../hooks/user/manufacturing/solidPreparationConfig";

export type MaterialTypeKey = "solid" | "liquid" | "linear";

export type RawMaterialPreparationSubmitResponse = {
  formId: string;
  batchId: string;
  status: string;
};

type ProcessInstance = {
  processId?: string;
  processKey?: string;
  data?: any;
};

export type RawMaterialPreparationDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  materialTypes: MaterialTypeKey[];
  formSubmissionType: string;
  solidPreparation?: {
    instances?: ProcessInstance[];
  };
  liquidPreparation?: {
    partA?: {
      jacketTemp?: string | number;
      rpm?: string | number;
      time?: string | number;
    };
    partB?: {
      rows?: Array<{
        materialCode?: string;
        materialName?: string;
        percentage?: string | number;
        weightKg?: string | number;
        lotNo?: string;
        dateTime?: string;
        remarks?: string;
      }>;
    };
  };
  linearPreparation?: {
    premix?: {
      timeA?: string | number;
      remarksA?: string;
      timeB?: string | number;
      remarksB?: string;
      timeC?: string | number;
      remarksC?: string;
    };
    finalMix?: {
      timeA?: string | number;
      remarksA?: string;
      timeB?: string | number;
      remarksB?: string;
    };
  };
};

const PROCESS_ID_TO_KEY = SOLID_PROCESSES.reduce<Record<string, string>>((acc, process) => {
  if (process.processId) {
    acc[process.processId] = process.key;
  }
  return acc;
}, {});

const PROCESS_KEY_TO_ID = SOLID_PROCESSES.reduce<Record<string, string>>((acc, process) => {
  if (process.processId) {
    acc[process.key] = process.processId;
  }
  return acc;
}, {});

const toText = (value: any) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const toNumberOrString = (value: any) => {
  if (value === "" || value === null || value === undefined) return "";
  const num = Number(value);
  return Number.isNaN(num) ? value : num;
};

const toDateTimeLocal = (value: string | undefined) => {
  if (!value) return "";
  const normalized = String(value);
  if (normalized.length >= 16) {
    return normalized.slice(0, 16);
  }
  return normalized;
};

const toDateTimeIso = (value: string | undefined) => {
  if (!value) return "";
  if (value.includes("T") && value.length === 16) {
    return `${value}:00`;
  }
  return value;
};

export const getSelectedTypesFromMaterialTypes = (materialTypes: MaterialTypeKey[]) => {
  const types = new Set((materialTypes ?? []).map((t) => String(t).toLowerCase()));
  return {
    solid: types.has("solid"),
    liquid: types.has("liquid"),
    linear: types.has("linear"),
  };
};

export const mapSolidInstancesFromDetails = (details: RawMaterialPreparationDetails) => {
  const instances = details?.solidPreparation?.instances ?? [];
  return instances.map((instance: ProcessInstance, index: number) => {
    const processKey = instance.processKey || PROCESS_ID_TO_KEY[String(instance.processId ?? "")] || "";
    return {
      instanceId: index + 1,
      processKey,
      data: instance.data ?? {},
    };
  }).filter((instance) => Boolean(instance.processKey));
};

export const mapLiquidFromDetails = (details: RawMaterialPreparationDetails) => {
  const partA = details?.liquidPreparation?.partA ?? {};
  const rows = details?.liquidPreparation?.partB?.rows ?? [];

  return {
    partA: {
      jacketTemp: toText(partA.jacketTemp),
      rpm: toText(partA.rpm),
      time: toText(partA.time),
    },
    rows: rows.map((row, index) => ({
      id: index + 1,
      material: String(row.materialCode ?? row.materialName ?? ""),
      percentage: toText(row.percentage),
      weightKg: toText(row.weightKg),
      lotNo: toText(row.lotNo),
      dateTime: toDateTimeLocal(row.dateTime),
      remarks: toText(row.remarks),
    })),
  };
};

export const mapLinearFromDetails = (details: RawMaterialPreparationDetails) => {
  const premix = details?.linearPreparation?.premix ?? {};
  const finalMix = details?.linearPreparation?.finalMix ?? {};

  return {
    premix: {
      timeA: toText(premix.timeA),
      remarksA: toText(premix.remarksA),
      timeB: toText(premix.timeB),
      remarksB: toText(premix.remarksB),
      timeC: toText(premix.timeC),
      remarksC: toText(premix.remarksC),
    },
    finalMix: {
      timeA: toText(finalMix.timeA),
      remarksA: toText(finalMix.remarksA),
      timeB: toText(finalMix.timeB),
      remarksB: toText(finalMix.remarksB),
    },
  };
};

export const mapPreparationPayload = (params: {
  selectedTypes: { solid: boolean; liquid: boolean; linear: boolean };
  solidInstances: Array<{ processKey: string; data: any }>;
  liquidData: {
    partA: { jacketTemp: string; rpm: string; time: string };
    rows: Array<{
      material: string;
      percentage: string;
      weightKg: string;
      lotNo: string;
      dateTime: string;
      remarks: string;
    }>;
  };
  linearData: {
    premix: {
      timeA: string;
      remarksA: string;
      timeB: string;
      remarksB: string;
      timeC: string;
      remarksC: string;
    };
    finalMix: {
      timeA: string;
      remarksA: string;
      timeB: string;
      remarksB: string;
    };
  };
  intent: "draft" | "submit";
}) => {
  const { selectedTypes, solidInstances, liquidData, linearData, intent } = params;

  const materialTypes: MaterialTypeKey[] = [];
  if (selectedTypes.solid) materialTypes.push("solid");
  if (selectedTypes.liquid) materialTypes.push("liquid");
  if (selectedTypes.linear) materialTypes.push("linear");

  const payload: any = { materialTypes };

  if (selectedTypes.solid) {
    const solidInstancesPayload = (solidInstances ?? [])
      .filter((inst) => Boolean(inst.processKey) && Boolean(PROCESS_KEY_TO_ID[inst.processKey]))
      .map((inst) => ({
        processId: PROCESS_KEY_TO_ID[inst.processKey],
        data: inst.data ?? {},
      }));

    payload.solidPreparation = {
      instances: intent === "draft"
        ? solidInstancesPayload
        : solidInstancesPayload.filter((inst) => Object.keys(inst.data ?? {}).length > 0),
    };
  }

  if (selectedTypes.liquid) {
    payload.liquidPreparation = {
      partA: {
        jacketTemp: toNumberOrString(liquidData.partA.jacketTemp),
        rpm: toNumberOrString(liquidData.partA.rpm),
        time: toNumberOrString(liquidData.partA.time),
      },
      partB: {
        rows: (liquidData.rows ?? []).map((row) => ({
          materialCode: String(row.material ?? "").trim(),
          percentage: toNumberOrString(row.percentage),
          weightKg: toNumberOrString(row.weightKg),
          lotNo: String(row.lotNo ?? ""),
          dateTime: toDateTimeIso(row.dateTime),
          remarks: String(row.remarks ?? ""),
        })),
      },
    };
  }

  if (selectedTypes.linear) {
    payload.linearPreparation = {
      premix: {
        timeA: toNumberOrString(linearData.premix.timeA),
        remarksA: String(linearData.premix.remarksA ?? ""),
        timeB: toNumberOrString(linearData.premix.timeB),
        remarksB: String(linearData.premix.remarksB ?? ""),
        timeC: toNumberOrString(linearData.premix.timeC),
        remarksC: String(linearData.premix.remarksC ?? ""),
      },
      finalMix: {
        timeA: toNumberOrString(linearData.finalMix.timeA),
        remarksA: String(linearData.finalMix.remarksA ?? ""),
        timeB: toNumberOrString(linearData.finalMix.timeB),
        remarksB: String(linearData.finalMix.remarksB ?? ""),
      },
    };
  }

  return payload;
};

export class RawMaterialPreparationSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(data: Partial<RawMaterialPreparationSubmitResponse> = {}) {
    this.formId = data.formId ?? "";
    this.batchId = data.batchId ?? "";
    this.status = data.status ?? "";
  }

  static fromApi(data: any) {
    return new RawMaterialPreparationSubmitResponseModel({
      formId: data?.formId,
      batchId: data?.batchId,
      status: data?.status,
    });
  }
}

export class RawMaterialPreparationDetailsModel {
  static fromApi(data: any): RawMaterialPreparationDetails {
    return {
      formId: String(data?.formId ?? ""),
      batchId: String(data?.batchId ?? ""),
      subDepartmentId: Number(data?.subDepartmentId ?? 0),
      materialTypes: Array.isArray(data?.materialTypes) ? data.materialTypes : [],
      formSubmissionType: String(data?.formSubmissionType ?? ""),
      solidPreparation: data?.solidPreparation ?? { instances: [] },
      liquidPreparation: data?.liquidPreparation ?? { partA: {}, partB: { rows: [] } },
      linearPreparation: data?.linearPreparation ?? { premix: {}, finalMix: {} },
    };
  }
}
