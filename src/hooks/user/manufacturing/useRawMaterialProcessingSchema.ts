import { useEffect, useState } from "react";
import rawMaterialPreparationController from "../../../controllers/user/manufacturing/rawMaterialPreparationController";
import { getProcessingSchemaFallback } from "./rawMaterialProcessingSchemaFallback";
import type { RawMaterialProcessingSchema } from "../../../data/models/user/rawMaterialProcessingSchema.types";

export const useRawMaterialProcessingSchema = (materialCode: string) => {
  const [schema, setSchema] = useState<RawMaterialProcessingSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    const code = String(materialCode ?? "").trim();
    if (!code) {
      setSchema(null);
      setError(null);
      setUsedFallback(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setUsedFallback(false);

      const response = await rawMaterialPreparationController.fetchProcessingSchema({ materialCode: code });

      if (cancelled) return;

      if (response?.success && response.data?.sections?.length) {
        setSchema(response.data);
        setLoading(false);
        return;
      }

      const fallback = getProcessingSchemaFallback(code);
      if (fallback) {
        setSchema(fallback);
        setUsedFallback(true);
        setError(null);
      } else {
        setSchema(null);
        setError(response?.message || "Unable to load processing schema for this material.");
      }
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [materialCode]);

  return { schema, loading, error, usedFallback };
};
