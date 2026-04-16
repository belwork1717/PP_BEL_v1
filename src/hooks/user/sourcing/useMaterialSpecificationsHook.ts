import { useCallback, useState } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { operationsController } from "../../../controllers/user/operationsController";
import { MaterialSpecificationItemModel } from "../../../data/models/user/MaterialSpecificationModel";

type SpecificationCacheMap = Record<string, MaterialSpecificationItemModel[]>;
type LoadingMap = Record<string, boolean>;

export const useMaterialSpecificationsHook = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const [specificationCache, setSpecificationCache] = useState<SpecificationCacheMap>({});
  const [loadingByMaterial, setLoadingByMaterial] = useState<LoadingMap>({});

  const isMaterialLoading = useCallback(
    (materialCode: string) => Boolean(loadingByMaterial[materialCode]),
    [loadingByMaterial]
  );

  const fetchMaterialSpecifications = useCallback(
    async (materialCode: string): Promise<MaterialSpecificationItemModel[]> => {
      const code = materialCode.trim();
      if (!code) return [];

      const cached = specificationCache[code];
      if (cached) return cached;

      setLoadingByMaterial((prev) => ({ ...prev, [code]: true }));

      try {
        const response = await operationsController.fetchMaterialSpecificationList({ materialCode: code });

        if (!response?.success || !response.data) {
          const msg =
            response?.statusCode === 404
              ? STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_NOT_FOUND
              : response?.message || STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_FETCH_ERROR;
          showAlert(msg, "error");
          return [];
        }

        const specifications = response.data.specifications ?? [];
        setSpecificationCache((prev) => ({ ...prev, [code]: specifications }));
        return specifications;
      } catch (error) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.SPECIFICATIONS_FETCH_ERROR, "error");
        return [];
      } finally {
        setLoadingByMaterial((prev) => ({ ...prev, [code]: false }));
      }
    },
    [showAlert, specificationCache]
  );

  return {
    fetchMaterialSpecifications,
    isMaterialLoading,
  };
};

export default useMaterialSpecificationsHook;
