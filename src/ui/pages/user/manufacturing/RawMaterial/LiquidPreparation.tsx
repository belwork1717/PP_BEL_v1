// src/ui/pages/user/manufacturing/RawMaterialPrep/LiquidPreparation.jsx
//
// Liquid Preparation — two sub-blocks:
//   Part A : HTPB Blending  (fixed parameters)
//   Part B : Weightment     (dynamic material rows — dropdown + Add)

import React from "react";
import {
  Box, Stack, Typography, TextField, Chip, alpha,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Divider, InputAdornment,
  MenuItem, Button,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { icons } from "../../../../../app/theme/icons";
import { LIQUID_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/rawMaterialPreparation_theme";
import {
  LIQUID_PREP_TEXT,
  WEIGHTMENT_MATERIALS,
  getWeightmentMaterialColor,
} from "../../../../../hooks/user/manufacturing/liquidPreparationConfig";
import useLiquidPreparationHook from "../../../../../hooks/user/manufacturing/useLiquidPreparationHook";
import FormProgressChip from "../../../../components/common/FormProgressChip";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";

const {
  opacity: OpacityRoundedIcon,
  thermostat: ThermostatRoundedIcon,
  speed: SpeedRoundedIcon,
  timer: TimerRoundedIcon,
  science: ScienceRoundedIcon,
  settings: SettingsRoundedIcon,
  scale: ScaleRoundedIcon,
  add: AddRoundedIcon,
  expandMore: ExpandMoreRoundedIcon,
  looksOne: LooksOneRoundedIcon,
  looksTwo: LooksTwoRoundedIcon,
  percent: PercentRoundedIcon,
  monitorWeight: MonitorWeightRoundedIcon,
  tag: TagRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
  info: InfoOutlinedIcon,
} = icons.user.manufacturing.rawMaterial.liquidPreparation;

// ─── Palette ──────────────────────────────────────────────────────────────────
const BRAND = LIQUID_PREP_BRAND;

// ─── Animations ───────────────────────────────────────────────────────────────
const slideIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const rowSlideIn = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const pulseBlue = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 ${alpha(BRAND.liquid, 0.18)}; }
  50%       { box-shadow: 0 0 0 6px ${alpha(BRAND.liquid, 0)}; }
`;

// ─── Styled primitives ────────────────────────────────────────────────────────
const SectionCard = styled(Box)({
  borderRadius: 16,
  border: `1px solid ${alpha(BRAND.liquid, 0.2)}`,
  background: "#fff",
  overflow: "hidden",
  boxShadow: `0 2px 18px ${alpha(BRAND.liquid, 0.08)}`,
  animation: `${slideIn} 0.35s ease both`,
});

const SectionHeader = styled(Box)({
  padding: "13px 20px",
  background: `linear-gradient(135deg, ${alpha(BRAND.liquid, 0.08)}, ${alpha(BRAND.liquidLight, 0.04)})`,
  borderBottom: `1px solid ${alpha(BRAND.liquid, 0.15)}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.liquid}, ${BRAND.liquidLight})`,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.7rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "11px 14px",
  whiteSpace: "nowrap",
  borderBottom: "none",
});

const TD = styled(TableCell)({
  padding: "10px 14px",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.55)}`,
  verticalAlign: "middle",
});

// Shared input sx — compact, consistent with the rest of the codebase
const inputSx = (width = 130) => ({
  width,
  "& .MuiOutlinedInput-root": {
    borderRadius: 7,
    background: BRAND.surface,
    fontSize: "0.8rem",
    transition: "all 0.18s",
    "& fieldset": { borderColor: BRAND.border },
    "&:hover fieldset": { borderColor: BRAND.liquidLight },
    "&.Mui-focused fieldset": { borderColor: BRAND.liquid, borderWidth: 2 },
    "&.Mui-focused": {
      background: "#fff",
      boxShadow: `0 0 0 3px ${alpha(BRAND.liquid, 0.1)}`,
    },
  },
  "& .MuiInputBase-input": {
    fontWeight: 500,
    color: BRAND.text,
    padding: "6px 10px",
    fontSize: "0.8rem",
  },
  "& .MuiInputAdornment-root svg": { fontSize: "14px !important" },
});

// Liquid preparation defaults and material config are sourced from hook/config modules.

// ─── OperationLabel (Part A) ──────────────────────────────────────────────────
const OperationLabel = ({ step, icon: Icon, title, subtitle }) => (
  <Stack direction="row" alignItems="flex-start" gap={1.5} sx={{ p: "14px 18px" }}>
    <Box sx={{
      width: 26, height: 26, borderRadius: "8px", flexShrink: 0,
      background: `linear-gradient(135deg, ${BRAND.liquid}, ${BRAND.liquidLight})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 2px 6px ${alpha(BRAND.liquid, 0.3)}`,
      mt: 0.2,
    }}>
      {step === 1
        ? <LooksOneRoundedIcon sx={{ color: "#fff", fontSize: 15 }} />
        : <LooksTwoRoundedIcon sx={{ color: "#fff", fontSize: 15 }} />}
    </Box>
    <Stack gap={0.25}>
      <Stack direction="row" alignItems="center" gap={0.7}>
        <Icon sx={{ fontSize: 14, color: BRAND.liquid }} />
        <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text }}>
          {title}
        </Typography>
      </Stack>
      {subtitle && (
        <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, lineHeight: 1.45 }}>
          {subtitle}
        </Typography>
      )}
    </Stack>
  </Stack>
);

// ─── Part A: HTPB Blending ────────────────────────────────────────────────────
const PartA_HTBPBlending = ({ values, onChange }) => {
  const filledCount = [values.jacketTemp, values.rpm, values.time].filter(Boolean).length;

  return (
    <SectionCard>
      <SectionHeader>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
            background: `linear-gradient(135deg, ${BRAND.liquid}, ${BRAND.liquidLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 3px 10px ${alpha(BRAND.liquid, 0.32)}`,
            animation: `${pulseBlue} 2.8s ease-in-out infinite`,
          }}>
            <SettingsRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
                {LIQUID_PREP_TEXT.PART_A_TITLE}
              </Typography>
              <Chip label={LIQUID_PREP_TEXT.PART_A_TAG} size="small" sx={{
                height: 18, fontSize: "0.6rem", fontWeight: 800,
                background: `linear-gradient(135deg, ${BRAND.liquid}, ${BRAND.liquidLight})`,
                color: "#fff", border: "none", letterSpacing: "0.06em",
              }} />
            </Stack>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
              {LIQUID_PREP_TEXT.PART_A_SUBTITLE}
            </Typography>
          </Box>
        </Stack>

        <FormProgressChip
          filledCount={filledCount}
          totalCount={3}
          accentColor={BRAND.accent}
          warnColor={BRAND.warn}
          completeLabel={LIQUID_PREP_TEXT.ALL_FILLED}
          suffixLabel={LIQUID_PREP_TEXT.FILLED_SUFFIX}
        />
      </SectionHeader>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TH sx={{ width: "44%" }}>Operation</TH>
              <TH>Parameter Specified</TH>
            </TableRow>
          </TableHead>
          <TableBody>

            {/* Row 1 */}
            <TableRow sx={{ "&:hover": { background: alpha(BRAND.liquid, 0.025) } }}>
              <TD sx={{ p: 0 }}>
                <OperationLabel
                  step={1}
                  icon={ThermostatRoundedIcon}
                  title="Circulate hot water in the jacket"
                  subtitle="In case of binder blending system"
                />
              </TD>
              <TD>
                <Box>
                  <Typography sx={{
                    fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.07em",
                    textTransform: "uppercase", color: BRAND.textSub, mb: 0.7,
                  }}>
                    Jacket Temp
                  </Typography>
                  <TextField
                    size="small"
                    value={values.jacketTemp}
                    onChange={(e) => onChange("jacketTemp", e.target.value)}
                    placeholder="e.g. 50"
                    type="number"
                    sx={inputSx(180)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ThermostatRoundedIcon sx={{ color: alpha(BRAND.liquid, 0.7) }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>°C</Typography>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </TD>
            </TableRow>

            {/* Row 2 */}
            <TableRow sx={{
              "&:hover": { background: alpha(BRAND.liquid, 0.025) },
              background: alpha(BRAND.surface, 0.5),
              "&:last-child td": { borderBottom: "none" },
            }}>
              <TD sx={{ p: 0 }}>
                <OperationLabel
                  step={2}
                  icon={SpeedRoundedIcon}
                  title="Agitate HTPB"
                  subtitle={null}
                />
              </TD>
              <TD>
                <Stack direction={{ xs: "column", sm: "row" }} gap={2.5} alignItems="flex-start">
                  <Box>
                    <Typography sx={{
                      fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.07em",
                      textTransform: "uppercase", color: BRAND.textSub, mb: 0.7,
                    }}>
                      RPM
                    </Typography>
                    <TextField
                      size="small"
                      value={values.rpm}
                      onChange={(e) => onChange("rpm", e.target.value)}
                      placeholder="e.g. 40"
                      type="number"
                      sx={inputSx(160)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SpeedRoundedIcon sx={{ color: alpha(BRAND.liquid, 0.7) }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>rpm</Typography>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <Divider orientation="vertical" flexItem
                    sx={{ borderColor: alpha(BRAND.border, 0.7), display: { xs: "none", sm: "block" }, my: 0.5 }}
                  />

                  <Box>
                    <Typography sx={{
                      fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.07em",
                      textTransform: "uppercase", color: BRAND.textSub, mb: 0.7,
                    }}>
                      Time
                    </Typography>
                    <TextField
                      size="small"
                      value={values.time}
                      onChange={(e) => onChange("time", e.target.value)}
                      placeholder="e.g. 30"
                      type="number"
                      sx={inputSx(160)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimerRoundedIcon sx={{ color: alpha(BRAND.liquid, 0.7) }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>min</Typography>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Stack>
              </TD>
            </TableRow>

          </TableBody>
        </Table>
      </TableContainer>
    </SectionCard>
  );
};

// ─── Part B: Weightment ───────────────────────────────────────────────────────
/**
 * Props:
 *   rows       WeightmentRow[]
 *   onChange   (id, field, value) => void
 *   onRemove   (id) => void
 */
const PartB_Weightment_Table = ({ rows, onChange, onRemove }) => (
  <TableContainer sx={{ overflowX: "auto" }}>
    <Table sx={{ minWidth: 860 }}>
      <TableHead>
        <TableRow>
          <TH sx={{ minWidth: 120 }}>Material</TH>
          <TH sx={{ minWidth: 110 }}>Percentage (%)</TH>
          <TH sx={{ minWidth: 160 }}>Weight Transferred (Kg)</TH>
          <TH sx={{ minWidth: 130 }}>Lot No.</TH>
          <TH sx={{ minWidth: 180 }}>Date &amp; Time of Weighing</TH>
          <TH sx={{ minWidth: 160 }}>Remarks</TH>
          <TH sx={{ minWidth: 52,  textAlign: "center" }}></TH>
        </TableRow>
      </TableHead>

      <TableBody>
        {rows.map((row, idx) => {
          const matColor = getWeightmentMaterialColor(row.material, BRAND.primary);
          return (
            <TableRow
              key={row.id}
              sx={{
                background: idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55),
                "&:hover": { background: alpha(BRAND.liquid, 0.028) },
                "&:last-child td": { borderBottom: "none" },
                animation: `${rowSlideIn} 0.22s ease both`,
              }}
            >
              {/* Material chip — read-only */}
              <TD>
                <Chip
                  label={row.material}
                  size="small"
                  sx={{
                    height: 24, fontSize: "0.72rem", fontWeight: 700,
                    background: matColor.bg,
                    color: matColor.color,
                    border: `1px solid ${matColor.border}`,
                  }}
                />
              </TD>

              {/* Percentage */}
              <TD>
                <TextField
                  size="small"
                  value={row.percentage}
                  onChange={(e) => onChange(row.id, "percentage", e.target.value)}
                  placeholder="0.00"
                  type="number"
                  sx={inputSx(110)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>%</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </TD>

              {/* Weight Kg */}
              <TD>
                <TextField
                  size="small"
                  value={row.weightKg}
                  onChange={(e) => onChange(row.id, "weightKg", e.target.value)}
                  placeholder="0.000"
                  type="number"
                  sx={inputSx(140)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MonitorWeightRoundedIcon sx={{ color: alpha(BRAND.liquid, 0.65) }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>Kg</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </TD>

              {/* Lot No. */}
              <TD>
                <TextField
                  size="small"
                  value={row.lotNo}
                  onChange={(e) => onChange(row.id, "lotNo", e.target.value)}
                  placeholder="e.g. LOT-001"
                  sx={inputSx(130)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TagRoundedIcon sx={{ color: alpha(BRAND.liquid, 0.65) }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </TD>

              {/* Date & Time of Weighing */}
              <TD>
                <TextField
                  size="small"
                  type="datetime-local"
                  value={row.dateTime}
                  onChange={(e) => onChange(row.id, "dateTime", e.target.value)}
                  sx={{
                    ...inputSx(175),
                    "& .MuiInputBase-input": {
                      fontWeight: 500,
                      color: BRAND.text,
                      padding: "6px 10px",
                      fontSize: "0.78rem",
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthRoundedIcon sx={{ color: alpha(BRAND.liquid, 0.65) }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </TD>

              {/* Remarks */}
              <TD>
                <TextField
                  size="small"
                  multiline
                  minRows={1}
                  maxRows={3}
                  value={row.remarks}
                  onChange={(e) => onChange(row.id, "remarks", e.target.value)}
                  placeholder={LIQUID_PREP_TEXT.OPTIONAL_REMARKS}
                  sx={{
                    ...inputSx(155),
                    "& .MuiInputBase-input": {
                      fontWeight: 500,
                      color: BRAND.text,
                      padding: "5px 8px",
                      fontSize: "0.78rem",
                      lineHeight: 1.5,
                    },
                  }}
                />
              </TD>

              {/* Delete */}
              <TD sx={{ textAlign: "center", px: "8px" }}>
                <RemoveProcessButton
                  onClick={() => onRemove(row.id)}
                  dangerColor={BRAND.danger}
                  tooltip={LIQUID_PREP_TEXT.REMOVE_ROW_TOOLTIP}
                />
              </TD>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

/**
 * Part B container — receives all state and handlers from hook.
 */
const PartB_Weightment = ({
  rows,
  selectedMaterial,
  onSelectedMaterialChange,
  onAdd,
  onChange,
  onRemove,
  filledRows,
}) => {

  return (
    <SectionCard sx={{ mt: 2.5 }}>
      {/* ── Header ── */}
      <SectionHeader>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
            background: `linear-gradient(135deg, ${BRAND.liquid}, ${BRAND.liquidLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 3px 10px ${alpha(BRAND.liquid, 0.32)}`,
          }}>
            <ScaleRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>{LIQUID_PREP_TEXT.PART_B_TITLE}</Typography>
              <Chip label={LIQUID_PREP_TEXT.PART_B_TAG} size="small" sx={{
                height: 18, fontSize: "0.6rem", fontWeight: 800,
                background: `linear-gradient(135deg, ${BRAND.liquid}, ${BRAND.liquidLight})`,
                color: "#fff", border: "none", letterSpacing: "0.06em",
              }} />
            </Stack>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
              {LIQUID_PREP_TEXT.PART_B_SUBTITLE}
            </Typography>
          </Box>
        </Stack>

        {rows.length > 0 && (
          <Stack direction="row" gap={1} alignItems="center">
            <Chip
              label={LIQUID_PREP_TEXT.MATERIAL_COUNT_LABEL(rows.length)}
              size="small"
              sx={{
                height: 22, fontSize: "0.65rem", fontWeight: 700,
                background: alpha(BRAND.liquid, 0.1), color: BRAND.liquid,
                border: `1px solid ${alpha(BRAND.liquid, 0.25)}`,
              }}
            />
            <FormProgressChip
              filledCount={filledRows}
              totalCount={rows.length}
              accentColor={BRAND.accent}
              warnColor={BRAND.warn}
              completeLabel={LIQUID_PREP_TEXT.ALL_FILLED}
              suffixLabel={LIQUID_PREP_TEXT.FILLED_SUFFIX}
            />
          </Stack>
        )}
      </SectionHeader>

      {/* ── Material selector row ── */}
      <Box sx={{
        px: "18px", py: "13px",
        background: `linear-gradient(135deg, ${alpha(BRAND.liquid, 0.03)}, ${alpha(BRAND.liquidLight, 0.02)})`,
        borderBottom: `1px dashed ${alpha(BRAND.liquid, 0.2)}`,
      }}>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} alignItems={{ sm: "center" }}>
          {/* Label */}
          <Typography sx={{
            fontSize: "0.72rem", fontWeight: 700, color: BRAND.primary,
            letterSpacing: "0.03em", flexShrink: 0,
          }}>
            {LIQUID_PREP_TEXT.ADD_MATERIAL}
          </Typography>

          {/* Dropdown */}
          <TextField
            select
            size="small"
            value={selectedMaterial}
            onChange={(e) => onSelectedMaterialChange(e.target.value)}
            sx={{
              width: 200,
              "& .MuiOutlinedInput-root": {
                borderRadius: 7, background: "#fff", fontSize: "0.82rem",
                "& fieldset": { borderColor: BRAND.border },
                "&:hover fieldset": { borderColor: BRAND.liquidLight },
                "&.Mui-focused fieldset": { borderColor: BRAND.liquid, borderWidth: 2 },
              },
              "& .MuiSelect-select": { fontWeight: selectedMaterial ? 600 : 400 },
            }}
            SelectProps={{
              displayEmpty: true,
              IconComponent: ExpandMoreRoundedIcon,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ScienceRoundedIcon sx={{ fontSize: "15px !important", color: selectedMaterial ? BRAND.liquid : alpha(BRAND.textSub, 0.5) }} />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="" disabled>
              <Typography sx={{ color: "text.disabled", fontSize: "0.82rem" }}>
                {LIQUID_PREP_TEXT.SELECT_MATERIAL_PLACEHOLDER}
              </Typography>
            </MenuItem>
            {WEIGHTMENT_MATERIALS.map((mat) => {
              return (
                <MenuItem key={mat} value={mat} sx={{ gap: 1.2 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: BRAND.text }}>
                    {mat}
                  </Typography>
                </MenuItem>
              );
            })}
          </TextField>

          {/* Add button */}
          <Button
            variant="contained"
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={onAdd}
            disabled={!selectedMaterial}
            sx={{
              borderRadius: 2, fontWeight: 700, fontSize: "0.78rem",
              textTransform: "none", px: 2.2, py: "7px",
              background: `linear-gradient(135deg, ${BRAND.liquid}, ${BRAND.liquidLight})`,
              boxShadow: `0 3px 10px ${alpha(BRAND.liquid, 0.3)}`,
              whiteSpace: "nowrap",
              "&:hover": {
                boxShadow: `0 5px 14px ${alpha(BRAND.liquid, 0.4)}`,
                transform: "translateY(-1px)",
              },
              "&:disabled": { background: BRAND.border, boxShadow: "none", color: "#fff" },
              transition: "all 0.2s",
            }}
          >
            {LIQUID_PREP_TEXT.ADD_ROW}
          </Button>

          {/* Hint text */}
          <Stack direction="row" alignItems="center" gap={0.5}>
            <InfoOutlinedIcon sx={{ fontSize: 13, color: alpha(BRAND.textSub, 0.6) }} />
            <Typography sx={{ fontSize: "0.68rem", color: alpha(BRAND.textSub, 0.75) }}>
              {LIQUID_PREP_TEXT.MATERIAL_HINT}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* ── Table or empty state ── */}
      {rows.length === 0 ? (
        <Box sx={{
          py: 5, textAlign: "center",
          background: alpha(BRAND.surface, 0.4),
        }}>
          <ScaleRoundedIcon sx={{ fontSize: 32, color: alpha(BRAND.liquid, 0.25), mb: 1 }} />
          <Typography sx={{ fontWeight: 600, color: BRAND.textSub, fontSize: "0.85rem" }}>
            {LIQUID_PREP_TEXT.EMPTY_ROWS_TITLE}
          </Typography>
          <Typography sx={{ fontSize: "0.73rem", color: alpha(BRAND.textSub, 0.65), mt: 0.4 }}>
            {LIQUID_PREP_TEXT.EMPTY_ROWS_SUBTITLE}
          </Typography>
        </Box>
      ) : (
        <PartB_Weightment_Table
          rows={rows}
          onChange={onChange}
          onRemove={onRemove}
        />
      )}
    </SectionCard>
  );
};

// ─── LiquidPreparation (container) ───────────────────────────────────────────
/**
 * Props (wired from RawMaterialPrepPage):
 *   data              object   — active batch
 *   isEditMode        bool
 *   onBlocksChange    (blocks) => void  — notify parent of data presence
 *   onBack            () => void
 */
const LiquidPreparation = ({
  data          = {},
  initialData,
  isEditMode    = false,
  onBlocksChange,
  onBack,
}) => {
  const {
    partA,
    partBRows,
    selectedMaterial,
    setSelectedMaterial,
    filledRowsCount,
    handlePartAChange,
    handleAddMaterialRow,
    handleRowChange,
    handleRowRemove,
  } = useLiquidPreparationHook(initialData, onBlocksChange);

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Section title ── */}
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
        <Box sx={{
          width: 36, height: 36, borderRadius: "11px",
          background: `linear-gradient(135deg, ${BRAND.liquid}, ${BRAND.liquidLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 12px ${alpha(BRAND.liquid, 0.3)}`,
        }}>
          <OpacityRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: BRAND.text }}>
            {LIQUID_PREP_TEXT.SECTION_TITLE}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.15 }}>
            {LIQUID_PREP_TEXT.SECTION_SUBTITLE}
          </Typography>
        </Box>
      </Stack>

      {/* ── Part A ── */}
      <PartA_HTBPBlending values={partA} onChange={handlePartAChange} />

      {/* ── Part B ── */}
      <PartB_Weightment
        rows={partBRows}
        selectedMaterial={selectedMaterial}
        onSelectedMaterialChange={setSelectedMaterial}
        onAdd={handleAddMaterialRow}
        onChange={handleRowChange}
        onRemove={handleRowRemove}
        filledRows={filledRowsCount}
      />

    </Box>
  );
};

export default LiquidPreparation;
