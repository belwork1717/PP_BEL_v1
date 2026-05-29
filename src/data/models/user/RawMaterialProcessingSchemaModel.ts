import type {
  RawMaterialProcessingSchema,
  RawMaterialProcessingSection,
} from "./rawMaterialProcessingSchema.types";

export const normalizeRawMaterialProcessingSchema = (payload: unknown): RawMaterialProcessingSchema | null => {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const details = data.rawMaterialDetails as RawMaterialProcessingSchema["rawMaterialDetails"] | undefined;
  const sections = Array.isArray(data.sections) ? (data.sections as RawMaterialProcessingSection[]) : [];

  if (!details?.materialCode || sections.length === 0) return null;

  return {
    rawMaterialDetails: details,
    screen: String(data.screen ?? ""),
    module: String(data.module ?? ""),
    sections,
  };
};
