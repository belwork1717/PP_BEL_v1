import type { RawMaterialProcessingSection } from "../../../data/models/user/rawMaterialProcessingSchema.types";

export const cloneSchemaRow = (row: Record<string, unknown>) => {
  try {
    return structuredClone(row);
  } catch {
    return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
  }
};

export const buildInitialSectionData = (sections: RawMaterialProcessingSection[]) =>
  Object.fromEntries(
    sections.map((section) => [
      section.sectionId,
      section.defaultRows?.length ? section.defaultRows.map((row) => cloneSchemaRow(row)) : [{}],
    ])
  ) as Record<string, Record<string, unknown>[]>;

export const isPresetTableCell = (
  sectionId: string,
  colKey: string,
  row: Record<string, unknown>
) => {
  if (colKey === "setParameter" && (row.displayValue || typeof row.setParameter === "object")) {
    return true;
  }
  if (sectionId === "blendingCumDryingParameters" && (colKey === "operation" || colKey === "setParameter")) {
    return true;
  }
  if (sectionId === "dryingOperationRvd" && colKey === "operation") {
    return true;
  }
  return false;
};

export const schemaSectionHasUserData = (sectionData: Record<string, Record<string, unknown>[]>) =>
  Object.values(sectionData).some((rows) =>
    rows.some((row) =>
      Object.entries(row).some(([key, value]) => {
        if (key === "displayValue" || key === "srNo") return false;
        if (value && typeof value === "object") return true;
        return String(value ?? "").trim().length > 0;
      })
    )
  );
