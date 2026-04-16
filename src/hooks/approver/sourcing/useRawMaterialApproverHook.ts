import { useMemo, useState } from "react";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { APPROVER_STATUS_META, APPROVER_PRIORITY_META } from "../../../app/theme/approver";
import useApproverFormAction from "../useApproverFormAction";
import rawMaterialProcurementController from "../../../controllers/user/sourcing/rawMaterialProcurementController";

const DEPARTMENT_SLUG = "sourcing";
const SUB_DEPARTMENT_SLUG = "raw-material";

const S = STRINGS.SOURCING.SPECIFICATION_FORM;

const mapDetailsToQcBlocks = (details: any) =>
  (details?.materials ?? []).map((material: any) => ({
    material: material.materialCode,
    lotNo: material.lotNo ?? "",
    rows: (material.specifications ?? []).map((spec: any) => ({
      specificationCode: spec.specificationCode,
      specification: spec.specificationName,
      refRange:
        spec?.referenceRange?.minValue != null && spec?.referenceRange?.maxValue != null
          ? `${spec.referenceRange.minValue} - ${spec.referenceRange.maxValue}${spec.referenceRange.unit ? ` ${spec.referenceRange.unit}` : ""}`
          : spec?.referenceRange?.minValue != null
            ? `>= ${spec.referenceRange.minValue}${spec.referenceRange.unit ? ` ${spec.referenceRange.unit}` : ""}`
            : spec?.referenceRange?.maxValue != null
              ? `<= ${spec.referenceRange.maxValue}${spec.referenceRange.unit ? ` ${spec.referenceRange.unit}` : ""}`
              : "N/A",
      analysedResult:
        spec.analysedResult === null || spec.analysedResult === undefined
          ? ""
          : String(spec.analysedResult),
      remarks: spec.remarks ?? "",
    })),
  }));

export const useRawMaterialApproverHook = () => {
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: DEPARTMENT_SLUG,
    setItems,
    setSelected,
    subDepartment: SUB_DEPARTMENT_SLUG,
  });

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find(
        (sd) => sd.slugs?.dept === DEPARTMENT_SLUG && sd.slugs?.subDept === SUB_DEPARTMENT_SLUG,
      )?.subDepartmentId ?? null,
    [user],
  );

  const handleViewDetails = async (row: any) => {
    setSelected({ ...row, qcBlocks: [] });
    setDetailsLoading(true);

    if (!subDepartmentId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(STRINGS.APPROVER.ACTION.SUBDEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    if (!row?.formId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const response = await rawMaterialProcurementController.fetchFormDetails({
      formId: row.formId,
      subDepartmentId,
    });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      showAlert(response?.message || S.DETAILS_FETCH_ERROR, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    setSelected({
      ...row,
      batchId: response.data.batchId || row.batchId,
      formId: response.data.formId || row.formId,
      qcBlocks: mapDetailsToQcBlocks(response.data),
    });
  };

  const handleCloseDetail = () => {
    if (detailsLoading) return;
    setSelected(null);
  };

  return {
    items,
    selected,
    detailsLoading,
    dialogProps,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
    statusMeta: APPROVER_STATUS_META,
    priorityMeta: APPROVER_PRIORITY_META,
  };
};

export default useRawMaterialApproverHook;
