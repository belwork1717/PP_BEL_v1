// src/ui/pages/user/sourcing/components/CasingDetailsForm.jsx
import React, { useMemo } from "react";
import {
  Box, Stack, Typography, TextField, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";

import { icons } from "../../../../../app/theme/icons";

import FormInput from "../../../../components/common/FormInput";
import MediaUpload from "../../../../components/common/MediaUpload";
import StackRow from "../../../../components/common/StackRow";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getSourcingTheme from "../../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import { STRINGS } from "../../../../../app/config/strings";

const {
  badge: BadgeRoundedIcon,
  assignment: AssignmentRoundedIcon,
  science: ScienceRoundedIcon,
  warning: WarningAmberRoundedIcon,
  visibility: VisibilityRoundedIcon,
  rocketLaunch: RocketLaunchRoundedIcon,
  errorOutline: ErrorOutlineRoundedIcon,
  info: InfoOutlinedIcon,
  subdirectoryArrowRight: SubdirectoryArrowRightRoundedIcon,
  ruler: RulerRoundedIcon,
} = icons.user.sourcing.casingDetailsForm;

const S = STRINGS.SOURCING.CASING_FORM;

const DIM_COLUMNS  = [S.DIM_COL_TB, S.DIM_COL_RL, S.DIM_COL_TLBR, S.DIM_COL_TRBL, S.DIM_COL_REMARKS];
const DIM_COL_KEYS = ["tb", "rl", "tlbr", "trbl", "remarks"];

const MandatoryChip = ({ theme }: any) => (
  <Chip
    icon={<ErrorOutlineRoundedIcon sx={{ ...theme.sourcing.rocketMotor.casingForm.mandatoryChipIcon, color: `${theme.palette.danger} !important` }} />}
    label={S.MANDATORY}
    size="small"
    sx={theme.sourcing.rocketMotor.casingForm.mandatoryChip}
  />
);

const SectionHeader = ({ icon: Icon, label, color, chip, theme }: any) => (
  <StackRow gap={1} sx={theme.workflow.formElements.sectionRow}>
    <Icon sx={{ fontSize: 16, color: color || theme.palette.primaryLight }} />
    <Typography sx={theme.sourcing.rocketMotor.casingForm.sectionHeaderLabel}>{label}</Typography>
    {chip && <Chip label={chip} size="small" sx={theme.sourcing.rocketMotor.casingForm.sectionChip(color)} />}
  </StackRow>
);

const DRRow = ({
  detailsName,
  detailsValue,
  remarksName,
  remarksValue,
  onChange,
  placeholder = "Enter details…",
  theme,
}: any) => (
  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
    <Box flex={1.5}>
      <Typography sx={theme.workflow.formElements.fieldLabel}>{S.DETAILS_LABEL}</Typography>
      <FormInput
        size="small"
        name={detailsName}
        value={detailsValue}
        onChange={onChange}
        placeholder={placeholder}
        label={undefined}
        sx={theme.workflow.formElements.textField}
      />
    </Box>
    <Box flex={1}>
      <Typography sx={theme.workflow.formElements.fieldLabel}>{S.REMARKS_LABEL}</Typography>
      <FormInput
        size="small"
        multiline
        rows={2}
        name={remarksName}
        value={remarksValue}
        onChange={onChange}
        placeholder={S.REMARKS_PH}
        label={undefined}
        sx={theme.workflow.formElements.multilineField}
      />
    </Box>
  </Stack>
);

const SubField = ({
  label,
  detailsName,
  detailsValue,
  remarksName,
  remarksValue,
  onChange,
  theme,
}: any) => (
  <Box sx={theme.sourcing.rocketMotor.casingForm.subFieldContainer}>
    <Stack direction="row" alignItems="center" gap={0.8} mb={0.8}>
      <SubdirectoryArrowRightRoundedIcon sx={theme.sourcing.rocketMotor.casingForm.subFieldArrow} />
      <Typography sx={theme.sourcing.rocketMotor.casingForm.subFieldLabel}>{label}</Typography>
    </Stack>
    <DRRow
      detailsName={detailsName}
      detailsValue={detailsValue}
      remarksName={remarksName}
      remarksValue={remarksValue}
      onChange={onChange}
      theme={theme}
    />
  </Box>
);

const DimensionalTable = ({ motorType, dimData, params, onDimChange, dimensionalParametersErrorMessage, theme }: any) => {
  const casingTheme = theme.sourcing.rocketMotor.casingForm;

  if (!motorType || params.length === 0) {
    const hasDimensionalError = Boolean(motorType && dimensionalParametersErrorMessage);

    return (
      <Box sx={theme.workflow.formElements.emptyStateBox}>
        <RulerRoundedIcon sx={casingTheme.emptyStateIcon} />
        <Typography sx={casingTheme.emptyStateTitle}>
          {hasDimensionalError ? S.DIMENSIONAL_REPORT : S.EMPTY_DIM_TITLE}
        </Typography>
        {hasDimensionalError ? (
          <Typography sx={{ ...casingTheme.emptyStateSubtitle, color: theme.palette.danger, fontWeight: 600 }}>
            {dimensionalParametersErrorMessage}
          </Typography>
        ) : (
          <Typography sx={casingTheme.emptyStateSubtitle}>
            {S.EMPTY_DIM_SUBTITLE}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box sx={casingTheme.dimTopMetaRow}>
        <Chip label={`${S.MOTOR_TYPE_CHIP_PREFIX}${motorType}`} size="small" sx={theme.workflow.formElements.primaryGradientChip} />
        <Chip label={`${params.length} ${S.PARAMETERS_SUFFIX}`} size="small" sx={theme.workflow.formElements.primaryLightChip} />
      </Box>

      <TableContainer sx={casingTheme.tableContainer}>
        <Table size="small" sx={{ minWidth: 780 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...casingTheme.tableHeaderLead }}>
                {S.DIMENSIONAL_REPORT}
              </TableCell>
              {DIM_COLUMNS.map((col) => (
                <TableCell
                  key={col}
                  sx={{
                    ...theme.workflow.formElements.tableHeader,
                    ...casingTheme.tableHeaderCell(col === S.DIM_COL_REMARKS),
                  }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {params.map((param: any, pi: number) => {
              const row = dimData[pi] || {};
              const isEven = pi % 2 === 0;

              return (
                <TableRow key={pi} sx={casingTheme.dataRow(isEven)}>
                  <TableCell sx={theme.workflow.formElements.tableCell}>
                    <Stack direction="row" alignItems="center" gap={0.8}>
                      <Box sx={casingTheme.paramIndexBadge}>
                        <Typography sx={casingTheme.paramIndexText}>{pi + 1}</Typography>
                      </Box>
                      <Typography sx={casingTheme.paramNameText}>{param.paramName || `Parameter ${pi + 1}`}</Typography>
                    </Stack>
                  </TableCell>

                  {DIM_COL_KEYS.slice(0, 4).map((key) => (
                    <TableCell sx={theme.workflow.formElements.tableCell} key={key}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={row[key] || ""}
                        onChange={(e) => onDimChange(pi, key, e.target.value)}
                        placeholder="—"
                        sx={theme.workflow.formElements.cellField}
                        InputProps={{ sx: casingTheme.dimInput }}
                      />
                    </TableCell>
                  ))}

                  <TableCell sx={theme.workflow.formElements.tableCell}>
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      minRows={1}
                      maxRows={2}
                      value={row.remarks || ""}
                      onChange={(e) => onDimChange(pi, "remarks", e.target.value)}
                      placeholder={S.REMARKS_PH}
                      sx={{
                        ...theme.workflow.formElements.cellField,
                        ...casingTheme.remarksCellField,
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const CasingDetailsForm = ({
  formData,
  onChange,
  onMediaChange,
  onDimChange,
  dimensionalParameters = [],
  dimensionalParametersErrorMessage = "",
  motorType,
  isEditMode = false,
}: any) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);
  const casingTheme = theme.sourcing.rocketMotor.casingForm;
  const sectionColors = casingTheme.sectionColors;

  return (
    <Box sx={casingTheme.root}>
      {isEditMode && (
        <Box sx={casingTheme.editModeBanner}>
          <WarningAmberRoundedIcon sx={{ ...casingTheme.editModeIcon, color: theme.palette.danger }} />
          <Typography sx={casingTheme.editModeBannerText}>
            {S.EDIT_MODE_WARNING}
          </Typography>
        </Box>
      )}

      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={casingTheme.headerIconBox}>
            <RocketLaunchRoundedIcon sx={casingTheme.headerLaunchIcon} />
          </Box>
          <Box>
            <Typography sx={casingTheme.headerTitle}>{S.TITLE}</Typography>
            <Typography sx={casingTheme.headerSubtitle}>{S.SUBTITLE}</Typography>
          </Box>
        </Stack>
        <MandatoryChip theme={theme} />
      </Stack>

      <Box sx={theme.workflow.formElements.sectionBlock(sectionColors.motorId)}>
        <SectionHeader icon={BadgeRoundedIcon} label={S.MOTOR_ID} color={sectionColors.motorId} theme={theme} />
        <DRRow
          detailsName="motorIdDetails"
          detailsValue={formData.motorIdDetails}
          remarksName="motorIdRemarks"
          remarksValue={formData.motorIdRemarks}
          onChange={onChange}
          placeholder={S.MOTOR_ID_PH}
          theme={theme}
        />
      </Box>

      <Box sx={theme.workflow.formElements.sectionBlock(sectionColors.clearance)}>
        <SectionHeader icon={AssignmentRoundedIcon} label={S.CLEARANCE_REPORT} color={sectionColors.clearance} theme={theme} />
        <DRRow
          detailsName="motorClearanceDetails"
          detailsValue={formData.motorClearanceDetails}
          remarksName="motorClearanceRemarks"
          remarksValue={formData.motorClearanceRemarks}
          onChange={onChange}
          placeholder={S.CLEARANCE_REPORT_PH}
          theme={theme}
        />
      </Box>

      <Box sx={theme.workflow.formElements.sectionBlock(sectionColors.insulation)}>
        <SectionHeader icon={ScienceRoundedIcon} label={S.INSULATION_REPORT} color={sectionColors.insulation} chip={`5 ${S.SUB_FIELDS}`} theme={theme} />
        <SubField label={S.TENSILE_STRENGTH} detailsName="tensileStrengthDetails" detailsValue={formData.tensileStrengthDetails} remarksName="tensileStrengthRemarks" remarksValue={formData.tensileStrengthRemarks} onChange={onChange} theme={theme} />
        <SubField label={S.ELONGATION} detailsName="elongationDetails" detailsValue={formData.elongationDetails} remarksName="elongationRemarks" remarksValue={formData.elongationRemarks} onChange={onChange} theme={theme} />
        <SubField label={S.EROSION_RATE} detailsName="erosionRateDetails" detailsValue={formData.erosionRateDetails} remarksName="erosionRateRemarks" remarksValue={formData.erosionRateRemarks} onChange={onChange} theme={theme} />
        <SubField label={S.THERMAL_CONDUCTIVITY} detailsName="thermalConductivityDetails" detailsValue={formData.thermalConductivityDetails} remarksName="thermalConductivityRemarks" remarksValue={formData.thermalConductivityRemarks} onChange={onChange} theme={theme} />
        <SubField label={S.UT_NDT} detailsName="utNdtDetails" detailsValue={formData.utNdtDetails} remarksName="utNdtRemarks" remarksValue={formData.utNdtRemarks} onChange={onChange} theme={theme} />
      </Box>

      <Box sx={theme.workflow.formElements.sectionBlock(sectionColors.waivers)}>
        <SectionHeader icon={WarningAmberRoundedIcon} label={S.WAIVERS} color={sectionColors.waivers} theme={theme} />
        <DRRow
          detailsName="waiversDetails"
          detailsValue={formData.waiversDetails}
          remarksName="waiversRemarks"
          remarksValue={formData.waiversRemarks}
          onChange={onChange}
          placeholder={S.WAIVERS_PH}
          theme={theme}
        />
      </Box>

      <Box sx={theme.workflow.formElements.sectionBlock(sectionColors.visual)}>
        <SectionHeader icon={VisibilityRoundedIcon} label={S.VISUAL_OBS} color={sectionColors.clearance} theme={theme} />
        <MediaUpload
          value={formData.mediaFilePath}
          onChange={onMediaChange}
          label={S.VISUAL_OBS}
          description={S.VISUAL_OBS_DESC}
          accept="image/*,video/*"
        />
      </Box>

      <Box sx={theme.workflow.formElements.sectionBlock(sectionColors.dimensional)}>
        <SectionHeader icon={RulerRoundedIcon} label={S.DIMENSIONAL_REPORT} color={sectionColors.dimensional} chip={motorType ? `Motor ${motorType}` : undefined} theme={theme} />
        <DimensionalTable
          motorType={motorType}
          params={dimensionalParameters}
          dimData={formData.dimensionalData || []}
          onDimChange={onDimChange}
          dimensionalParametersErrorMessage={dimensionalParametersErrorMessage}
          theme={theme}
        />
      </Box>

      <Stack direction="row" alignItems="center" gap={1} mt={1} px={1.5} py={1} sx={theme.workflow.formElements.infoFooterNote}>
        <InfoOutlinedIcon sx={casingTheme.footerInfoIcon} />
        <Typography sx={casingTheme.footerNoteText}>
          {S.FOOTER_NOTE}
        </Typography>
      </Stack>
    </Box>
  );
};

export default CasingDetailsForm;
