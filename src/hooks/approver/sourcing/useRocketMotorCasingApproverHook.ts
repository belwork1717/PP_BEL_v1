import { useMemo, useState } from "react";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { APPROVER_STATUS_META, APPROVER_PRIORITY_META } from "../../../app/theme/approver";
import useApproverFormAction from "../useApproverFormAction";
import rocketMotorCasingController from "../../../controllers/user/sourcing/rocketMotorCasingController";

const DEPARTMENT_SLUG = "sourcing";
const SUB_DEPARTMENT_SLUG = "rocket-motor";

const S = STRINGS.SOURCING.CASING_FORM;

const DETAIL_COLS = [
  { key: "specification", label: "Section / Parameter", width: "35%" },
  { key: "analysedResult", label: "Details", width: "35%" },
  { key: "remarks", label: "Remarks", width: "30%" },
];

const mapCasingDetailsToBlocks = (details: any) => {
  if (!details?.casingDetails) return [];

  const cd = details.casingDetails;

  const insulationRows = [
    { specification: "Tensile Strength", analysedResult: cd.tensileStrengthDetails || "—", remarks: cd.tensileStrengthRemarks || "—" },
    { specification: "Elongation", analysedResult: cd.elongationDetails || "—", remarks: cd.elongationRemarks || "—" },
    { specification: "Erosion Rate", analysedResult: cd.erosionRateDetails || "—", remarks: cd.erosionRateRemarks || "—" },
    { specification: "Thermal Conductivity", analysedResult: cd.thermalConductivityDetails || "—", remarks: cd.thermalConductivityRemarks || "—" },
    { specification: "UT / NDT Report", analysedResult: cd.utNdtDetails || "—", remarks: cd.utNdtRemarks || "—" },
  ];

  const blocks: any[] = [
    {
      material: "Motor & Clearance",
      lotNo: "",
      rows: [
        { specification: "Motor ID", analysedResult: cd.motorIdDetails || "—", remarks: cd.motorIdRemarks || "—" },
        { specification: "Motor Clearance Report", analysedResult: cd.motorClearanceDetails || "—", remarks: cd.motorClearanceRemarks || "—" },
      ],
      _columns: DETAIL_COLS,
    },
    {
      material: "Insulation Clearance Report",
      lotNo: "",
      rows: insulationRows,
      _columns: DETAIL_COLS,
    },
  ];

  if (cd.waiversDetails) {
    blocks.push({
      material: "Waivers if Any",
      lotNo: "",
      rows: [{ specification: "Waiver Ref.", analysedResult: cd.waiversDetails, remarks: cd.waiversRemarks || "—" }],
      _columns: DETAIL_COLS,
    });
  }

  if (cd.mediaFilePath) {
    blocks.push({
      material: "Visual Observation",
      lotNo: "",
      rows: [
        {
          specification: "File Reference",
          analysedResult: typeof cd.mediaFilePath === "string" ? cd.mediaFilePath : cd.mediaFilePath?.name || "—",
          remarks: "—",
        },
      ],
      _columns: DETAIL_COLS,
    });
  }

  const dimRows =
    cd.dimensionalData?.length > 0
      ? cd.dimensionalData.map((d: any) => ({
          specification: d.paramName || d.paramId || "—",
          analysedResult: `T-B: ${d.tb ?? "—"}  R-L: ${d.rl ?? "—"}  TL-BR: ${d.tlbr ?? "—"}  TR-BL: ${d.trbl ?? "—"}`,
          remarks: d.remarks || "—",
        }))
      : [{ specification: "No dimensional data recorded", analysedResult: "—", remarks: "—" }];

  blocks.push({ material: "Dimensional Inspection Report", lotNo: "", rows: dimRows, _columns: DETAIL_COLS });

  return blocks;
};

export const useRocketMotorCasingApproverHook = () => {
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
    setSelected({ ...row, casingBlocks: [] });
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

    const response = await rocketMotorCasingController.fetchFormDetails({
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
      casingBlocks: mapCasingDetailsToBlocks(response.data),
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

export default useRocketMotorCasingApproverHook;
