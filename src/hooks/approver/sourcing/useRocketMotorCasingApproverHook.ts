import { useState } from "react";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { APPROVER_STATUS_META, APPROVER_PRIORITY_META } from "../../../app/theme/approver";
import useApproverFormAction from "../useApproverFormAction";
import rocketMotorCasingController from "../../../controllers/user/sourcing/rocketMotorCasingController";
import { RocketMotorCasingDetailsModel } from "../../../data/models/user/RocketMotorCasingProcurementModel";
import type { RocketFormData } from "../../../hooks/user/sourcing/sourcingWorkflowData";

const DEPARTMENT_SLUG = "sourcing";
const SUB_DEPARTMENT_SLUG = "rocket-motor";

const S = STRINGS.SOURCING.CASING_FORM;

const DETAIL_COLS = [
  { key: "specification", label: "Section / Parameter", width: "35%" },
  { key: "analysedResult", label: "Details", width: "35%" },
  { key: "remarks", label: "Remarks", width: "30%" },
];

const mapFormDataToCasingBlocks = (cd: RocketFormData) => {
  const insulationRows = [
    { specification: "Tensile Strength", analysedResult: cd.tensileStrengthDetails || "—", remarks: cd.tensileStrengthRemarks || "—" },
    { specification: "Elongation", analysedResult: cd.elongationDetails || "—", remarks: cd.elongationRemarks || "—" },
    { specification: "Erosion Rate", analysedResult: cd.erosionRateDetails || "—", remarks: cd.erosionRateRemarks || "—" },
    { specification: "Thermal Conductivity", analysedResult: cd.thermalConductivityDetails || "—", remarks: cd.thermalConductivityRemarks || "—" },
    { specification: "UT / NDT Report", analysedResult: cd.utNdtDetails || "—", remarks: cd.utNdtRemarks || "—" },
  ];

  const blocks: any[] = [
    {
      material: "Motor casing",
      lotNo: cd.motorCasingId || "—",
      rows: [
        { specification: "Motor stage", analysedResult: cd.motorStageApi || "—", remarks: "—" },
        { specification: "Motor no.", analysedResult: cd.motorNoApi || "—", remarks: "—" },
        {
          specification: "Items received",
          analysedResult: `${cd.itemsDescription || "—"} · ${cd.itemsDimension || "—"} ${cd.itemsUnit || ""}`.trim(),
          remarks: "—",
        },
      ],
      _columns: DETAIL_COLS,
    },
    {
      material: "Motor & Clearance",
      lotNo: "",
      rows: [
        { specification: "Motor ID (legacy / notes)", analysedResult: cd.motorIdDetails || "—", remarks: cd.motorIdRemarks || "—" },
        { specification: "Motor Clearance Report", analysedResult: cd.motorClearanceDetails || "—", remarks: cd.motorClearanceRemarks || "—" },
      ],
      _columns: DETAIL_COLS,
    },
    {
      material: "Insulation report",
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

  blocks.push({
    material: "Weighment",
    lotNo: "",
    rows: [
      {
        specification: "Weight without harness (kg)",
        analysedResult: cd.weightWithoutHarness || "—",
        remarks: "—",
      },
      {
        specification: "Weight with harness (kg)",
        analysedResult: cd.weightWithHarness || "—",
        remarks: cd.calibrationRef ? `Calibration: ${cd.calibrationRef}` : "—",
      },
    ],
    _columns: DETAIL_COLS,
  });

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

  const handleViewDetails = async (row: any) => {
    setSelected({ ...row, casingBlocks: [] });
    setDetailsLoading(true);

    const motorCasingId = String(row?.motorCasingId ?? row?.batchId ?? "").trim();
    if (!motorCasingId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const response = await rocketMotorCasingController.fetchFormDetails({
      motorCasingId,
    });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const err = response?.error as { details?: string } | undefined;
      showAlert(err?.details || response?.message || S.DETAILS_FETCH_ERROR, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    const model = response.data as RocketMotorCasingDetailsModel;
    const cd = RocketMotorCasingDetailsModel.toFormData(model);

    setSelected({
      ...row,
      batchId: motorCasingId,
      motorCasingId,
      formId: row.formId ?? model.motorCasingId,
      casingBlocks: mapFormDataToCasingBlocks(cd),
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
