import type { RawMaterialProcessingSchema } from "../../../data/models/user/rawMaterialProcessingSchema.types";

/** Dev fallback until processing-schema API is available for AP. */
export const AP_PROCESSING_SCHEMA_FALLBACK: RawMaterialProcessingSchema = {
  screen: "SOLID_INGREDIENT_PROCESSING",
  module: "RAW_MATERIAL_PROCESSING",
  rawMaterialDetails: {
    rawMaterialId: 1,
    materialCode: "AP",
    materialName: "Ammonium Perchlorate",
    availableGrades: [
      { gradeId: 101, gradeCode: "COARSE", gradeName: "AP Coarse" },
      { gradeId: 102, gradeCode: "FINE", gradeName: "AP Fine" },
      { gradeId: 103, gradeCode: "ULTRAFINE", gradeName: "AP Ultrafine" },
    ],
  },
  sections: [
    {
      sectionId: "feedMaterialDetails",
      title: "Feed Material Details",
      type: "dynamic-group",
      addRowAllowed: true,
      fields: [
        { key: "lotNumber", label: "Lot Number", type: "text" },
        { key: "quantity", label: "Quantity", type: "number", unit: "kg" },
      ],
    },
    {
      sectionId: "blendingCumDryingParameters",
      title: "Blending cum Drying",
      type: "table",
      addRowAllowed: true,
      columns: [
        { key: "srNo", label: "Sr. No.", type: "number", readonly: true },
        { key: "operation", label: "Operation", type: "text" },
        { key: "setParameter", label: "Set Parameter", type: "text" },
        { key: "actualParameter", label: "Actual Parameter", type: "text" },
      ],
      defaultRows: [
        { operation: "Hot Water Circulation Temperature Set", setParameter: "75±5°C" },
        { operation: "Material Quantity", setParameter: "Total Quantity from various lots" },
      ],
    },
    {
      sectionId: "dryingOperationRvd",
      title: "Drying Operation in RVD",
      type: "table",
      addRowAllowed: true,
      columns: [
        { key: "srNo", label: "Sr. No.", type: "number", readonly: true },
        { key: "operation", label: "Operation", type: "text" },
        { key: "setParameter", label: "Set Parameter", type: "text" },
        { key: "actualParameter", label: "Actual Parameter", type: "text" },
        { key: "startTime", label: "Start Time", type: "datetime" },
        { key: "endTime", label: "End Time", type: "datetime" },
      ],
      defaultRows: [
        {
          srNo: 1,
          operation: "Drying",
          setParameter: {
            temperature: { value: 65, tolerance: "±2", unit: "°C" },
            duration: { value: 90, unit: "min" },
          },
          displayValue: "Temp.: 65±2°C\nDuration: 90 min",
        },
        {
          srNo: 2,
          operation: "Vacuum Application",
          setParameter: {
            vacuum: { value: 150, unit: "torr" },
            time: { value: 25, unit: "min" },
          },
          displayValue: "Vacuum: 150 torr\nTime: 25 min",
        },
      ],
    },
    {
      sectionId: "unloadingDispatchBins",
      title: "Unloading of Material & Dispatch to Mixing",
      type: "dynamic-group",
      addRowAllowed: true,
      fields: [
        { key: "binNumber", label: "Bin Number", type: "text" },
        { key: "binCapacity", label: "Bin Capacity", type: "number", unit: "kg" },
        { key: "materialFilledQuantity", label: "Quantity of Material Filled", type: "number", unit: "kg" },
      ],
    },
    {
      sectionId: "particleSizeDistribution",
      title: "Particle Size Distribution",
      type: "table",
      addRowAllowed: false,
      columns: [
        { key: "psdRequirement", label: "PSD/PS Required", type: "text", readonly: true },
        { key: "specification", label: "Specification", type: "text", readonly: true },
        { key: "result", label: "Result", type: "number" },
      ],
      defaultRows: [
        { psdRequirement: "Above 500 µm, % max", specification: "5" },
        { psdRequirement: "500-355 µm, %", specification: "27±5" },
        { psdRequirement: "355-300 µm, %", specification: "32±5" },
        { psdRequirement: "300-45 µm, %", specification: "33±5" },
        { psdRequirement: "Less than 45 µm, %", specification: "1" },
      ],
    },
  ],
};

const FALLBACK_BY_CODE: Record<string, RawMaterialProcessingSchema> = {
  AP: AP_PROCESSING_SCHEMA_FALLBACK,
};

export const getProcessingSchemaFallback = (materialCode: string) =>
  FALLBACK_BY_CODE[String(materialCode ?? "").toUpperCase()] ?? null;
