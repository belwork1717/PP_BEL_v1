import { Box, Chip, Stack, Typography, alpha } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { isMaterialUnset } from "../../../../../hooks/user/manufacturing/useRawMaterialPrepHook";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";

const {
  grain: GrainRoundedIcon,
  opacity: OpacityRoundedIcon,
  blurLinear: BlurLinearRoundedIcon,
  lock: LockRoundedIcon,
  info: InfoOutlinedIcon,
} = icons.user.manufacturing.rawMaterial.builderPage;

const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
const S = STRINGS.MANUFACTURING;

const MaterialTypeToggle = ({ type, checked, locked, onChange, theme }: any) => {
  const rmTheme = theme.manufacturing.rawMaterialPrep;
  const isSolid = type === "solid";
  const isLiquid = type === "liquid";
  const color = rmTheme.colors.material[type as keyof typeof rmTheme.colors.material] ?? theme.palette.primaryLight;
  const Icon = isSolid ? GrainRoundedIcon : isLiquid ? OpacityRoundedIcon : BlurLinearRoundedIcon;
  const label = isSolid ? RM.MATERIAL_SOLID : isLiquid ? RM.MATERIAL_LIQUID : RM.MATERIAL_LINEAR;

  return (
    <Box
      onClick={() => !locked && onChange()}
      sx={rmTheme.header.toggle.container(checked, locked, color)}
    >
      <Box sx={rmTheme.header.toggle.checkbox(checked, color)}>
        {checked && (
          <Box component="span" sx={rmTheme.header.toggle.checkMark} />
        )}
      </Box>
      <Icon sx={rmTheme.header.toggle.icon(checked, color)} />
      <Typography sx={rmTheme.header.toggle.label(checked, color)}>
        {label}
      </Typography>
      {locked && checked && <LockRoundedIcon sx={rmTheme.header.toggle.lockIcon(color)} />}
    </Box>
  );
};

const RawMaterialPreparationHeader = ({
  batch,
  isEdit,
  onBack,
  selectedTypes,
  onTypesChange,
  solidBuilderHasData = false,
  liquidBuilderHasData = false,
  linearBuilderHasData = false,
  theme,
}: any) => {
  const rmTheme = theme.manufacturing.rawMaterialPrep;
  const typeUnset = isMaterialUnset(batch.material);
  const showStrip = typeUnset || isEdit;
  const noneChosen = !selectedTypes.solid && !selectedTypes.liquid && !selectedTypes.linear;

  const resolvedTypeLabel = (() => {
    const { solid, liquid, linear } = selectedTypes;
    if (solid && liquid && linear) return RM.MATERIAL_ALL;
    if (solid && liquid) return RM.MATERIAL_SOLID_LIQUID;
    if (solid && linear) return RM.MATERIAL_SOLID_LINEAR;
    if (liquid && linear) return RM.MATERIAL_LIQUID_LINEAR;
    if (solid) return RM.MATERIAL_SOLID;
    if (liquid) return RM.MATERIAL_LIQUID;
    if (linear) return RM.MATERIAL_LINEAR;
    return null;
  })();

  const typeChipColor = resolvedTypeLabel === RM.MATERIAL_SOLID ? rmTheme.colors.material.solid
    : resolvedTypeLabel === RM.MATERIAL_LIQUID ? rmTheme.colors.material.liquid
    : resolvedTypeLabel === RM.MATERIAL_LINEAR ? rmTheme.colors.material.linear
    : theme.palette.primaryLight;

  const footerContent = showStrip ? (
    <Box sx={rmTheme.header.footerContainer(isEdit)}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={2} flexWrap="wrap">
        <Stack direction="row" alignItems="center" gap={0.7} sx={rmTheme.header.selectorGroup}>
          <Typography sx={rmTheme.header.selectorLabel(isEdit)}>
            {RM.TYPE_SELECTOR_LABEL}
          </Typography>
          <Typography sx={rmTheme.header.selectorHint}>
            {isEdit ? RM.TYPE_SELECTOR_EDIT_HINT : RM.TYPE_SELECTOR_NEW_HINT}
          </Typography>
        </Stack>

        <Stack direction="row" gap={1} alignItems="center">
          <MaterialTypeToggle type="solid" checked={selectedTypes.solid} locked={isEdit && solidBuilderHasData} onChange={() => onTypesChange({ ...selectedTypes, solid: !selectedTypes.solid })} theme={theme} />
          <MaterialTypeToggle type="liquid" checked={selectedTypes.liquid} locked={isEdit && liquidBuilderHasData} onChange={() => onTypesChange({ ...selectedTypes, liquid: !selectedTypes.liquid })} theme={theme} />
          <MaterialTypeToggle type="linear" checked={selectedTypes.linear} locked={isEdit && linearBuilderHasData} onChange={() => onTypesChange({ ...selectedTypes, linear: !selectedTypes.linear })} theme={theme} />
        </Stack>

        {noneChosen && (
          <Stack direction="row" alignItems="center" gap={0.6} sx={rmTheme.header.noTypeBox}>
            <InfoOutlinedIcon sx={rmTheme.header.noTypeIcon} />
            <Typography sx={rmTheme.header.noTypeText}>{RM.SELECT_AT_LEAST_ONE}</Typography>
          </Stack>
        )}

        {isEdit && (solidBuilderHasData || liquidBuilderHasData || linearBuilderHasData) && (
          <Stack direction="row" alignItems="center" gap={0.6} sx={rmTheme.header.lockBox}>
            <LockRoundedIcon sx={rmTheme.header.lockIcon} />
            <Typography sx={rmTheme.header.lockText}>{RM.LOCK_EXPLANATION}</Typography>
          </Stack>
        )}
      </Stack>
    </Box>
  ) : null;

  return (
    <UserWorkflowFormHeader
      batch={batch}
      isEdit={isEdit}
      onBack={onBack}
      newLabel={RM.NEW_LABEL}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      editLabel={S.FORM_HEADER.EDITING_REJECTED}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      additionalChips={resolvedTypeLabel ? (
        <Chip
          icon={resolvedTypeLabel === RM.MATERIAL_SOLID ? <GrainRoundedIcon sx={{ fontSize: "12px !important", color: `${typeChipColor} !important` }} /> : resolvedTypeLabel === RM.MATERIAL_LIQUID ? <OpacityRoundedIcon sx={{ fontSize: "12px !important", color: `${typeChipColor} !important` }} /> : undefined}
          label={resolvedTypeLabel}
          size="small"
          sx={rmTheme.header.typeChip(typeChipColor)}
        />
      ) : null}
      footerContent={footerContent}
      headerContentSx={rmTheme.header.contentPadding}
      theme={theme}
    />
  );
};

export default RawMaterialPreparationHeader;