// src/ui/pages/user/manufacturing/RawMaterialPrep/SolidPreparation.jsx
//
// Solid Preparation
//   — Process selector (dropdown + Add button)
//   — For each selected process, a dedicated form card is rendered
//
// Processes:
//   1. AP Blending                        ← fully built here
//   2. Blending cum Drying                ← fully built here
//   3. Drying Operation in RVD            ← fully built here
//   4. Drying in Oven                     ← fully built here
//   5. Screening                          ← placeholder
//   6. Particle Size Distribution Details ← fully built here
//   7. Aluminium Processing               ← placeholder

import React from "react";
import {
  Box, Stack, Typography, TextField, Chip, alpha,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, InputAdornment,
  MenuItem, Button, IconButton, Tooltip,
  Radio, RadioGroup, FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { icons } from "../../../../../app/theme/icons";
import { SOLID_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/rawMaterialPreparation_theme";
import FormProgressChip from "../../../../components/common/FormProgressChip";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import {
  AP_BLENDING_ROWS,
  DRYING_RVD_ROWS,
  PSD_ROWS,
  SOLID_PREP_TEXT,
  SOLID_PROCESSES,
} from "../../../../../hooks/user/manufacturing/solidPreparationConfig";
import useSolidPreparationHook from "../../../../../hooks/user/manufacturing/useSolidPreparationHook";
import { useRawMaterialProcessingSchema } from "../../../../../hooks/user/manufacturing/useRawMaterialProcessingSchema";
import SchemaDrivenSolidPreparation from "./SchemaDrivenSolidPreparation";

const {
  grain: GrainRoundedIcon,
  add: AddRoundedIcon,
  expandMore: ExpandMoreRoundedIcon,
  info: InfoOutlinedIcon,
  science: ScienceRoundedIcon,
  blender: BlenderRoundedIcon,
  air: AirRoundedIcon,
  filterList: FilterListRoundedIcon,
  bubbleChart: BubbleChartRoundedIcon,
  memory: MemoryRoundedIcon,
  localFireDepartment: LocalFireDepartmentRoundedIcon,
  timer: TimerRoundedIcon,
  thermostat: ThermostatRoundedIcon,
  notes: NotesRoundedIcon,
  tag: TagRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
  tune: TuneRoundedIcon,
  monitorWeight: MonitorWeightRoundedIcon,
} = icons.user.manufacturing.rawMaterial.solidPreparation;

// ─── Palette ──────────────────────────────────────────────────────────────────
const BRAND = SOLID_PREP_BRAND;

// ─── Animations ───────────────────────────────────────────────────────────────
const slideDown = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const pulseBlue = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 ${alpha(BRAND.solid, 0.2)}; }
  50%       { box-shadow: 0 0 0 6px ${alpha(BRAND.solid, 0)}; }
`;

// ─── Styled primitives ────────────────────────────────────────────────────────
const ProcessCard = styled(Box)(() => ({
  borderRadius: 16,
  border: `1px solid ${alpha(BRAND.solid, 0.2)}`,
  background: "#fff",
  overflow: "hidden",
  boxShadow: `0 2px 18px ${alpha(BRAND.solid, 0.07)}`,
  animation: `${slideDown} 0.32s ease both`,
  animationDelay: "0ms",
}));

const ProcessCardHeader = styled(Box)({
  padding: "13px 20px",
  background: `linear-gradient(135deg, ${alpha(BRAND.solid, 0.07)}, ${alpha(BRAND.solidLight, 0.03)})`,
  borderBottom: `1px solid ${alpha(BRAND.solid, 0.14)}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

// Table header
const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.7rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "11px 16px",
  whiteSpace: "nowrap",
  borderBottom: "none",
});

// Table data cell
const TD = styled(TableCell)({
  padding: "11px 16px",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.55)}`,
  verticalAlign: "middle",
});

// Shared compact input sx
const inputSx = (width = 140) => ({
  width,
  "& .MuiOutlinedInput-root": {
    borderRadius: 7,
    background: BRAND.surface,
    fontSize: "0.8rem",
    transition: "all 0.18s",
    "& fieldset":         { borderColor: BRAND.border },
    "&:hover fieldset":   { borderColor: BRAND.solidLight },
    "&.Mui-focused fieldset": { borderColor: BRAND.solid, borderWidth: 2 },
    "&.Mui-focused": {
      background: "#fff",
      boxShadow: `0 0 0 3px ${alpha(BRAND.solid, 0.1)}`,
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

// AP rows and process catalogue are sourced from solidPreparationConfig.

// ─── AP Blending form ─────────────────────────────────────────────────────────
/**
 * Props:
 *   instanceId   string  — unique key if user adds multiple AP Blending cards
 *   data         { [rowId]: { parameter, time, remarks } }
 *   onChange     (rowId, field, value) => void
 *   onRemove     () => void
 *   animDelay    number (ms)
 */
const APBlendingForm = ({ instanceId, data, onChange, onRemove, animDelay = 0 }) => {
  // Count how many cells have been filled across all rows
  const allValues = Object.values(data).flatMap((r) => Object.values(r));
  const filledCount = allValues.filter((v) => String(v).trim() !== "").length;
  const totalCount  = allValues.length; // 3 rows × 3 fields = 9

  return (
    <ProcessCard sx={{ animationDelay: `${animDelay}ms` }}>
      {/* ── Card header ── */}
      <ProcessCardHeader>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
            background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 3px 10px ${alpha(BRAND.solid, 0.3)}`,
            animation: `${pulseBlue} 3s ease-in-out infinite`,
          }}>
            <BlenderRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>

          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
                AP Blending
              </Typography>
              <Chip
                label={`#${instanceId}`}
                size="small"
                sx={{
                  height: 18, fontSize: "0.6rem", fontWeight: 700,
                  background: alpha(BRAND.solid, 0.1),
                  color: BRAND.solid,
                  border: `1px solid ${alpha(BRAND.solid, 0.25)}`,
                }}
              />
            </Stack>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
              Record blending operation parameters and timings
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" gap={1} alignItems="center">
          <FormProgressChip
            filledCount={filledCount}
            totalCount={totalCount}
            accentColor={BRAND.accent}
            warnColor={BRAND.warn}
            completeLabel={SOLID_PREP_TEXT.ALL_FILLED}
            suffixLabel={SOLID_PREP_TEXT.FILLED_SUFFIX}
          />
          <RemoveProcessButton
            onClick={onRemove}
            dangerColor={BRAND.danger}
            tooltip={SOLID_PREP_TEXT.REMOVE_PROCESS_TOOLTIP}
          />
        </Stack>
      </ProcessCardHeader>

      {/* ── Table ── */}
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 680 }}>
          <TableHead>
            <TableRow>
              <TH sx={{ minWidth: 220 }}>Operation</TH>
              <TH sx={{ minWidth: 160 }}>Parameter</TH>
              <TH sx={{ minWidth: 140 }}>Time</TH>
              <TH sx={{ minWidth: 200 }}>Remarks / Lab Reference No.</TH>
            </TableRow>
          </TableHead>

          <TableBody>
            {AP_BLENDING_ROWS.map((row, idx) => {
              const rowData = data[row.id] ?? { parameter: "", time: "", remarks: "" };
              return (
                <TableRow
                  key={row.id}
                  sx={{
                    background: idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55),
                    "&:hover": { background: alpha(BRAND.solid, 0.025) },
                    "&:last-child td": { borderBottom: "none" },
                  }}
                >
                  {/* ── Operation (fixed label) ── */}
                  <TD>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      {/* Step number badge */}
                      <Box sx={{
                        width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
                        background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        mt: 0.1,
                        boxShadow: `0 1px 4px ${alpha(BRAND.solid, 0.3)}`,
                      }}>
                        <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>
                          {idx + 1}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text, lineHeight: 1.35 }}>
                          {row.operation}
                        </Typography>
                        {row.opSuffix && (
                          <Typography sx={{ fontSize: "0.68rem", color: BRAND.textSub, mt: 0.2, fontWeight: 500 }}>
                            {row.opSuffix}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TD>

                  {/* ── Parameter ── */}
                  <TD>
                    <TextField
                      size="small"
                      value={rowData.parameter}
                      onChange={(e) => onChange(row.id, "parameter", e.target.value)}
                      placeholder="Enter value"
                      multiline
                      minRows={1}
                      maxRows={3}
                      sx={{
                        ...inputSx(155),
                        "& .MuiInputBase-input": {
                          fontWeight: 500, color: BRAND.text,
                          padding: "5px 8px", fontSize: "0.8rem", lineHeight: 1.5,
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TuneRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </TD>

                  {/* ── Time ── */}
                  <TD>
                    <TextField
                      size="small"
                      value={rowData.time}
                      onChange={(e) => onChange(row.id, "time", e.target.value)}
                      placeholder="e.g. 30"
                      type="number"
                      sx={inputSx(130)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimerRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>
                              min
                            </Typography>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </TD>

                  {/* ── Remarks / Lab Ref ── */}
                  <TD>
                    <TextField
                      size="small"
                      value={rowData.remarks}
                      onChange={(e) => onChange(row.id, "remarks", e.target.value)}
                      placeholder={SOLID_PREP_TEXT.REMARKS_PLACEHOLDER}
                      multiline
                      minRows={1}
                      maxRows={3}
                      sx={{
                        ...inputSx(200),
                        "& .MuiInputBase-input": {
                          fontWeight: 500, color: BRAND.text,
                          padding: "5px 8px", fontSize: "0.78rem", lineHeight: 1.5,
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <NotesRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </TD>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </ProcessCard>
  );
};

// ─── Blending cum Drying form ─────────────────────────────────────────────────
/**
 * Props:
 *   instanceId   string/number
 *   data         { hotWaterCirculation: { temp, time, remarks } }
 *   onChange     (field, value) => void   — field is "temp" | "time" | "remarks"
 *   onRemove     () => void
 *   animDelay    number (ms)
 */
const BlendingCumDryingForm = ({ instanceId, data, onChange, onRemove, animDelay = 0 }) => {
  const row = data.hotWaterCirculation ?? { temp: "", time: "", remarks: "" };

  const filledCount = [row.temp, row.time, row.remarks].filter((v) => String(v).trim() !== "").length;

  return (
    <ProcessCard sx={{ animationDelay: `${animDelay}ms` }}>
      {/* ── Card header ── */}
      <ProcessCardHeader>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
            background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 3px 10px ${alpha(BRAND.solid, 0.3)}`,
            animation: `${pulseBlue} 3s ease-in-out infinite`,
          }}>
            <AirRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
                Blending cum Drying
              </Typography>
              <Chip
                label={`#${instanceId}`}
                size="small"
                sx={{
                  height: 18, fontSize: "0.6rem", fontWeight: 700,
                  background: alpha(BRAND.solid, 0.1), color: BRAND.solid,
                  border: `1px solid ${alpha(BRAND.solid, 0.25)}`,
                }}
              />
            </Stack>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
              Feed Material Details
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" gap={1} alignItems="center">
          <FormProgressChip
            filledCount={filledCount}
            totalCount={3}
            accentColor={BRAND.accent}
            warnColor={BRAND.warn}
            completeLabel={SOLID_PREP_TEXT.ALL_FILLED}
            suffixLabel={SOLID_PREP_TEXT.FILLED_SUFFIX}
          />
          <RemoveProcessButton
            onClick={onRemove}
            dangerColor={BRAND.danger}
            tooltip={SOLID_PREP_TEXT.REMOVE_PROCESS_TOOLTIP}
          />
        </Stack>
      </ProcessCardHeader>

      {/* ── Table ── */}
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TH sx={{ minWidth: 260 }}>Operation</TH>
              <TH sx={{ minWidth: 240 }}>Parameter</TH>
              <TH sx={{ minWidth: 200 }}>Remarks / Lab Reference No.</TH>
            </TableRow>
          </TableHead>

          <TableBody>
            <TableRow sx={{
              "&:hover": { background: alpha(BRAND.solid, 0.025) },
              "&:last-child td": { borderBottom: "none" },
            }}>

              {/* ── Operation (fixed) ── */}
              <TD>
                <Stack direction="row" alignItems="flex-start" gap={1.2}>
                  {/* Step badge */}
                  <Box sx={{
                    width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
                    background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mt: 0.1,
                    boxShadow: `0 1px 4px ${alpha(BRAND.solid, 0.3)}`,
                  }}>
                    <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>
                      1
                    </Typography>
                  </Box>
                  <Stack gap={0.3}>
                    <Stack direction="row" alignItems="center" gap={0.7}>
                      <ThermostatRoundedIcon sx={{ fontSize: 14, color: BRAND.solid }} />
                      <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text }}>
                        Hot Water circulation temperature set
                      </Typography>
                    </Stack>
                    {/* Unit shown as a small suffix chip */}
                    <Chip
                      label="°C"
                      size="small"
                      sx={{
                        height: 17, fontSize: "0.62rem", fontWeight: 700, width: "fit-content",
                        background: alpha(BRAND.solid, 0.08), color: BRAND.solid,
                        border: `1px solid ${alpha(BRAND.solid, 0.2)}`,
                      }}
                    />
                  </Stack>
                </Stack>
              </TD>

              {/* ── Parameter — Temp + Time side by side ── */}
              <TD>
                <Stack direction="row" gap={0} alignItems="center">

                  {/* Temp field */}
                  <Box>
                    <Typography sx={{
                      fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.07em",
                      textTransform: "uppercase", color: BRAND.textSub, mb: 0.7,
                    }}>
                      Temp
                    </Typography>
                    <TextField
                      size="small"
                      value={row.temp}
                      onChange={(e) => onChange("temp", e.target.value)}
                      placeholder="e.g. 60"
                      type="number"
                      sx={inputSx(130)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ThermostatRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} />
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

                  {/* Vertical divider — sits between the two inputs, no extra gap */}
                  <Box sx={{
                    alignSelf: "flex-end",
                    height: 34,
                    width: "1px",
                    background: alpha(BRAND.border, 0.8),
                    mx: 1.8,
                    mb: "1px",
                  }} />

                  {/* Time field */}
                  <Box>
                    <Typography sx={{
                      fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.07em",
                      textTransform: "uppercase", color: BRAND.textSub, mb: 0.7,
                    }}>
                      Time
                    </Typography>
                    <TextField
                      size="small"
                      value={row.time}
                      onChange={(e) => onChange("time", e.target.value)}
                      placeholder="e.g. 30"
                      type="number"
                      sx={inputSx(130)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimerRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} />
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

              {/* ── Remarks / Lab Reference No. ── */}
              <TD>
                <TextField
                  size="small"
                  value={row.remarks}
                  onChange={(e) => onChange("remarks", e.target.value)}
                  placeholder={SOLID_PREP_TEXT.REMARKS_PLACEHOLDER}
                  multiline
                  minRows={1}
                  maxRows={3}
                  sx={{
                    ...inputSx(195),
                    "& .MuiInputBase-input": {
                      fontWeight: 500, color: BRAND.text,
                      padding: "5px 8px", fontSize: "0.78rem", lineHeight: 1.5,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NotesRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </TD>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </ProcessCard>
  );
};

// Drying RVD rows are sourced from solidPreparationConfig.

// ─── Drying Operation in RVD form ─────────────────────────────────────────────
const DryingRVDForm = ({ instanceId, data, onChange, onRemove, animDelay = 0 }) => {
  // Count filled values across all rows
  const allValues = DRYING_RVD_ROWS.flatMap((row) =>
    [...row.paramFields.map((f) => data[row.id]?.[f.key] ?? ""),
     data[row.id]?.remarks ?? ""]
  );
  const filledCount = allValues.filter((v) => String(v).trim() !== "").length;
  const totalCount  = allValues.length;

  // Resolve icon component for a param field
  const resolveIcon = (iconKey) => {
    if (iconKey === "thermo") return <ThermostatRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} />;
    if (iconKey === "timer")  return <TimerRoundedIcon      sx={{ color: alpha(BRAND.solid, 0.65) }} />;
    if (iconKey === "tune")   return <TuneRoundedIcon       sx={{ color: alpha(BRAND.solid, 0.65) }} />;
    if (iconKey === "weight") return <MonitorWeightRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} />;
    return null;
  };

  return (
    <ProcessCard sx={{ animationDelay: `${animDelay}ms` }}>
      {/* ── Header ── */}
      <ProcessCardHeader>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
            background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 3px 10px ${alpha(BRAND.solid, 0.3)}`,
            animation: `${pulseBlue} 3s ease-in-out infinite`,
          }}>
            <LocalFireDepartmentRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
                Drying Operation in RVD
              </Typography>
              <Chip label={`#${instanceId}`} size="small" sx={{
                height: 18, fontSize: "0.6rem", fontWeight: 700,
                background: alpha(BRAND.solid, 0.1), color: BRAND.solid,
                border: `1px solid ${alpha(BRAND.solid, 0.25)}`,
              }} />
            </Stack>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
              Record drying parameters and observations for RVD operation
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" gap={1} alignItems="center">
          <FormProgressChip
            filledCount={filledCount}
            totalCount={totalCount}
            accentColor={BRAND.accent}
            warnColor={BRAND.warn}
            completeLabel={SOLID_PREP_TEXT.ALL_FILLED}
            suffixLabel={SOLID_PREP_TEXT.FILLED_SUFFIX}
          />
          <RemoveProcessButton
            onClick={onRemove}
            dangerColor={BRAND.danger}
            tooltip={SOLID_PREP_TEXT.REMOVE_PROCESS_TOOLTIP}
          />
        </Stack>
      </ProcessCardHeader>

      {/* ── Table ── */}
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 680 }}>
          <TableHead>
            <TableRow>
              <TH sx={{ minWidth: 210 }}>Operation</TH>
              <TH sx={{ minWidth: 260 }}>Parameter</TH>
              <TH sx={{ minWidth: 200 }}>Remarks / Lab Reference No.</TH>
            </TableRow>
          </TableHead>

          <TableBody>
            {DRYING_RVD_ROWS.map((row, idx) => {
              const rowData = data[row.id] ?? {};
              return (
                <TableRow
                  key={row.id}
                  sx={{
                    background: idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55),
                    "&:hover": { background: alpha(BRAND.solid, 0.025) },
                    "&:last-child td": { borderBottom: "none" },
                  }}
                >
                  {/* ── Operation (fixed label) ── */}
                  <TD>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <Box sx={{
                        width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
                        background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        mt: 0.15,
                        boxShadow: `0 1px 4px ${alpha(BRAND.solid, 0.3)}`,
                      }}>
                        <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>
                          {idx + 1}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text, lineHeight: 1.35, pt: 0.1 }}>
                        {row.label}
                      </Typography>
                    </Stack>
                  </TD>

                  {/* ── Parameter — one or two input fields ── */}
                  <TD>
                    <Stack direction="row" gap={0} alignItems="center" flexWrap="nowrap">
                      {row.paramFields.map((pf, pfIdx) => {
                        const iconEl = resolveIcon(pf.icon);
                        return (
                          <React.Fragment key={pf.key}>
                            {pfIdx > 0 && (
                              /* Thin divider between sibling fields */
                              <Box sx={{
                                alignSelf: "flex-end", height: 34, width: "1px",
                                background: alpha(BRAND.border, 0.8),
                                mx: 1.6, mb: "1px",
                              }} />
                            )}
                            <Box>
                              <Typography sx={{
                                fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.07em",
                                textTransform: "uppercase", color: BRAND.textSub, mb: 0.7,
                              }}>
                                {pf.label}
                              </Typography>
                              <TextField
                                size="small"
                                value={rowData[pf.key] ?? ""}
                                onChange={(e) => onChange(row.id, pf.key, e.target.value)}
                                placeholder={pf.unit ? `e.g. 0` : "Enter value"}
                                type={pf.type}
                                sx={inputSx(pf.paramFields?.length > 1 ? 118 : 150)}
                                InputProps={{
                                  ...(iconEl ? {
                                    startAdornment: (
                                      <InputAdornment position="start">{iconEl}</InputAdornment>
                                    ),
                                  } : {}),
                                  ...(pf.unit ? {
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>
                                          {pf.unit}
                                        </Typography>
                                      </InputAdornment>
                                    ),
                                  } : {}),
                                }}
                              />
                            </Box>
                          </React.Fragment>
                        );
                      })}
                    </Stack>
                  </TD>

                  {/* ── Remarks ── */}
                  <TD>
                    <TextField
                      size="small"
                      value={rowData.remarks ?? ""}
                      onChange={(e) => onChange(row.id, "remarks", e.target.value)}
                      placeholder={SOLID_PREP_TEXT.REMARKS_PLACEHOLDER}
                      multiline
                      minRows={1}
                      maxRows={3}
                      sx={{
                        ...inputSx(195),
                        "& .MuiInputBase-input": {
                          fontWeight: 500, color: BRAND.text,
                          padding: "5px 8px", fontSize: "0.78rem", lineHeight: 1.5,
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <NotesRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </TD>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </ProcessCard>
  );
};

// ─── Drying in Oven form ──────────────────────────────────────────────────────
/**
 * Row 2 (Drying Process) spans two visual sub-rows using rowSpan on the
 * Operation cell, so both sub-rows share the same left "Drying Process" label.
 */
const DryingOvenForm = ({ instanceId, data, onChange, onRemove, animDelay = 0 }) => {
  // Collect all fillable values for the progress chip
  const allValues = [
    data.materialLoading?.parameter,     data.materialLoading?.time,     data.materialLoading?.remarks,
    data.dryingWaterJacketed?.insideTemp, data.dryingWaterJacketed?.time, data.dryingWaterJacketed?.remarks,
    data.dryingAirOven?.temp,            data.dryingAirOven?.time,       data.dryingAirOven?.remarks,
    data.sampleCollection?.parameter,    data.sampleCollection?.time,    data.sampleCollection?.remarks,
  ];
  const filledCount = allValues.filter((v) => String(v ?? "").trim() !== "").length;
  const totalCount  = allValues.length;

  // Shared sub-label style for sub-row operation text
  const subRowLabelSx = { fontWeight: 600, fontSize: "0.76rem", color: BRAND.textSub, lineHeight: 1.35 };
  const subRowAccentSx = { fontWeight: 700, fontSize: "0.76rem", color: BRAND.solid };

  return (
    <ProcessCard sx={{ animationDelay: `${animDelay}ms` }}>
      {/* ── Header ── */}
      <ProcessCardHeader>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
            background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 3px 10px ${alpha(BRAND.solid, 0.3)}`,
            animation: `${pulseBlue} 3s ease-in-out infinite`,
          }}>
            <LocalFireDepartmentRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
                Drying in Oven
              </Typography>
              <Chip label={`#${instanceId}`} size="small" sx={{
                height: 18, fontSize: "0.6rem", fontWeight: 700,
                background: alpha(BRAND.solid, 0.1), color: BRAND.solid,
                border: `1px solid ${alpha(BRAND.solid, 0.25)}`,
              }} />
            </Stack>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
              Record oven drying parameters and observations
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" gap={1} alignItems="center">
          <FormProgressChip
            filledCount={filledCount}
            totalCount={totalCount}
            accentColor={BRAND.accent}
            warnColor={BRAND.warn}
            completeLabel={SOLID_PREP_TEXT.ALL_FILLED}
            suffixLabel={SOLID_PREP_TEXT.FILLED_SUFFIX}
          />
          <RemoveProcessButton
            onClick={onRemove}
            dangerColor={BRAND.danger}
            tooltip={SOLID_PREP_TEXT.REMOVE_PROCESS_TOOLTIP}
          />
        </Stack>
      </ProcessCardHeader>

      {/* ── Table ── */}
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TH sx={{ minWidth: 220 }}>Operation</TH>
              <TH sx={{ minWidth: 200 }}>Parameter</TH>
              <TH sx={{ minWidth: 140 }}>Time</TH>
              <TH sx={{ minWidth: 200 }}>Remarks / Lab Reference No.</TH>
            </TableRow>
          </TableHead>

          <TableBody>

            {/* ── Row 1: Material Loading into Oven ── */}
            <TableRow sx={{
              background: "#fff",
              "&:hover": { background: alpha(BRAND.solid, 0.025) },
            }}>
              <TD>
                <Stack direction="row" alignItems="flex-start" gap={1.2}>
                  <Box sx={{
                    width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
                    background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mt: 0.15, boxShadow: `0 1px 4px ${alpha(BRAND.solid, 0.3)}`,
                  }}>
                    <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>1</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text, lineHeight: 1.35, pt: 0.1 }}>
                    Material Loading into Oven
                  </Typography>
                </Stack>
              </TD>
              <TD>
                <TextField size="small"
                  value={data.materialLoading?.parameter ?? ""}
                  onChange={(e) => onChange("materialLoading", "parameter", e.target.value)}
                  placeholder="Enter value" multiline minRows={1} maxRows={3}
                  sx={{ ...inputSx(180), "& .MuiInputBase-input": { padding: "5px 8px", fontSize: "0.8rem", lineHeight: 1.5 } }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><TuneRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment> }}
                />
              </TD>
              <TD>
                <TextField size="small" type="number"
                  value={data.materialLoading?.time ?? ""}
                  onChange={(e) => onChange("materialLoading", "time", e.target.value)}
                  placeholder="e.g. 30" sx={inputSx(120)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><TimerRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>min</Typography></InputAdornment>,
                  }}
                />
              </TD>
              <TD>
                <TextField size="small"
                  value={data.materialLoading?.remarks ?? ""}
                  onChange={(e) => onChange("materialLoading", "remarks", e.target.value)}
                  placeholder={SOLID_PREP_TEXT.REMARKS_PLACEHOLDER} multiline minRows={1} maxRows={3}
                  sx={{ ...inputSx(195), "& .MuiInputBase-input": { padding: "5px 8px", fontSize: "0.78rem", lineHeight: 1.5 } }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><NotesRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment> }}
                />
              </TD>
            </TableRow>

            {/* ── Row 2a: Drying Process — sub-row 1 (water jacketed oven) ── */}
            {/* Operation cell rowSpan=2 covers both sub-rows                  */}
            <TableRow sx={{
              background: alpha(BRAND.surface, 0.55),
              "&:hover": { background: alpha(BRAND.solid, 0.025) },
            }}>
              {/* Merged operation cell spanning sub-rows 1 & 2 */}
              <TD rowSpan={2} sx={{
                verticalAlign: "top",
                borderRight: `1px solid ${alpha(BRAND.border, 0.5)}`,
                pt: "14px",
              }}>
                <Stack direction="row" alignItems="flex-start" gap={1.2}>
                  <Box sx={{
                    width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
                    background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mt: 0.15, boxShadow: `0 1px 4px ${alpha(BRAND.solid, 0.3)}`,
                  }}>
                    <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>2</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text, lineHeight: 1.35, pt: 0.1 }}>
                    Drying Process
                  </Typography>
                </Stack>
              </TD>

              {/* Sub-row 1: in water jacketed oven — inside temp */}
              <TD>
                <Stack gap={0.5}>
                  <Stack direction="row" alignItems="center" gap={0.6}>
                    <Box sx={{
                      width: 16, height: 16, borderRadius: "4px", flexShrink: 0,
                      background: alpha(BRAND.solid, 0.12),
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Typography sx={{ color: BRAND.solid, fontSize: "0.55rem", fontWeight: 800 }}>a</Typography>
                    </Box>
                    <Typography sx={subRowLabelSx}>in water jacketed oven</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap={0.6} sx={{ ml: 0.5 }}>
                    <Typography sx={{ fontSize: "0.67rem", fontWeight: 700, color: BRAND.textSub, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Inside Temp
                    </Typography>
                    <Typography sx={{ fontSize: "0.67rem", color: BRAND.textSub }}>@</Typography>
                  </Stack>
                  <TextField size="small" type="number"
                    value={data.dryingWaterJacketed?.insideTemp ?? ""}
                    onChange={(e) => onChange("dryingWaterJacketed", "insideTemp", e.target.value)}
                    placeholder="e.g. 60" sx={inputSx(150)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><ThermostatRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment>,
                      endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>°C</Typography></InputAdornment>,
                    }}
                  />
                </Stack>
              </TD>
              <TD>
                <TextField size="small" type="number"
                  value={data.dryingWaterJacketed?.time ?? ""}
                  onChange={(e) => onChange("dryingWaterJacketed", "time", e.target.value)}
                  placeholder="e.g. 60" sx={inputSx(120)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><TimerRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>min</Typography></InputAdornment>,
                  }}
                />
              </TD>
              <TD>
                <TextField size="small"
                  value={data.dryingWaterJacketed?.remarks ?? ""}
                  onChange={(e) => onChange("dryingWaterJacketed", "remarks", e.target.value)}
                  placeholder={SOLID_PREP_TEXT.REMARKS_PLACEHOLDER} multiline minRows={1} maxRows={3}
                  sx={{ ...inputSx(195), "& .MuiInputBase-input": { padding: "5px 8px", fontSize: "0.78rem", lineHeight: 1.5 } }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><NotesRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment> }}
                />
              </TD>
            </TableRow>

            {/* ── Row 2b: Drying Process — sub-row 2 (air oven) ── */}
            <TableRow sx={{
              background: alpha(BRAND.surface, 0.3),
              "&:hover": { background: alpha(BRAND.solid, 0.025) },
            }}>
              {/* No Operation TD here — covered by rowSpan above */}

              {/* Sub-row 2: in air oven @ temp — just one input */}
              <TD>
                <Stack gap={0.5}>
                  <Stack direction="row" alignItems="center" gap={0.6}>
                    <Box sx={{
                      width: 16, height: 16, borderRadius: "4px", flexShrink: 0,
                      background: alpha(BRAND.solid, 0.12),
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Typography sx={{ color: BRAND.solid, fontSize: "0.55rem", fontWeight: 800 }}>b</Typography>
                    </Box>
                    <Typography sx={subRowLabelSx}>in air oven</Typography>
                    <Typography sx={{ ...subRowAccentSx, ml: 0.3 }}>@ temp</Typography>
                  </Stack>
                  <TextField size="small" type="number"
                    value={data.dryingAirOven?.temp ?? ""}
                    onChange={(e) => onChange("dryingAirOven", "temp", e.target.value)}
                    placeholder="e.g. 80" sx={inputSx(150)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><ThermostatRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment>,
                      endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>°C</Typography></InputAdornment>,
                    }}
                  />
                </Stack>
              </TD>
              <TD>
                <TextField size="small" type="number"
                  value={data.dryingAirOven?.time ?? ""}
                  onChange={(e) => onChange("dryingAirOven", "time", e.target.value)}
                  placeholder="e.g. 60" sx={inputSx(120)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><TimerRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>min</Typography></InputAdornment>,
                  }}
                />
              </TD>
              <TD>
                <TextField size="small"
                  value={data.dryingAirOven?.remarks ?? ""}
                  onChange={(e) => onChange("dryingAirOven", "remarks", e.target.value)}
                  placeholder={SOLID_PREP_TEXT.REMARKS_PLACEHOLDER} multiline minRows={1} maxRows={3}
                  sx={{ ...inputSx(195), "& .MuiInputBase-input": { padding: "5px 8px", fontSize: "0.78rem", lineHeight: 1.5 } }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><NotesRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment> }}
                />
              </TD>
            </TableRow>

            {/* ── Row 3: Sample Collection and Analysis ── */}
            <TableRow sx={{
              background: "#fff",
              "&:hover": { background: alpha(BRAND.solid, 0.025) },
              "&:last-child td": { borderBottom: "none" },
            }}>
              <TD>
                <Stack direction="row" alignItems="flex-start" gap={1.2}>
                  <Box sx={{
                    width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
                    background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mt: 0.15, boxShadow: `0 1px 4px ${alpha(BRAND.solid, 0.3)}`,
                  }}>
                    <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>3</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text, lineHeight: 1.35, pt: 0.1 }}>
                    Sample Collection and Analysis
                  </Typography>
                </Stack>
              </TD>
              <TD>
                <TextField size="small"
                  value={data.sampleCollection?.parameter ?? ""}
                  onChange={(e) => onChange("sampleCollection", "parameter", e.target.value)}
                  placeholder="Enter value" multiline minRows={1} maxRows={3}
                  sx={{ ...inputSx(180), "& .MuiInputBase-input": { padding: "5px 8px", fontSize: "0.8rem", lineHeight: 1.5 } }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><TuneRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment> }}
                />
              </TD>
              <TD>
                <TextField size="small" type="number"
                  value={data.sampleCollection?.time ?? ""}
                  onChange={(e) => onChange("sampleCollection", "time", e.target.value)}
                  placeholder="e.g. 30" sx={inputSx(120)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><TimerRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>min</Typography></InputAdornment>,
                  }}
                />
              </TD>
              <TD>
                <TextField size="small"
                  value={data.sampleCollection?.remarks ?? ""}
                  onChange={(e) => onChange("sampleCollection", "remarks", e.target.value)}
                  placeholder={SOLID_PREP_TEXT.REMARKS_PLACEHOLDER} multiline minRows={1} maxRows={3}
                  sx={{ ...inputSx(195), "& .MuiInputBase-input": { padding: "5px 8px", fontSize: "0.78rem", lineHeight: 1.5 } }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><NotesRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment> }}
                />
              </TD>
            </TableRow>

          </TableBody>
        </Table>
      </TableContainer>
    </ProcessCard>
  );
};

// PSD rows are sourced from solidPreparationConfig.

// ─── PSD form ─────────────────────────────────────────────────────────────────
const PSDForm = ({ instanceId, data, onChange, onRemove, animDelay = 0 }) => {
  const header = data.header ?? { motorId: "", date: "", grindingBatchId: "" };
  const specs  = data.specs  ?? {};

  // Fill count: 3 header fields + 4 spec fields = 7
  const headerFilled = [header.motorId, header.date, header.grindingBatchId]
    .filter((v) => String(v ?? "").trim() !== "").length;
  const specFilled = PSD_ROWS
    .filter((r) => String(specs[r.id]?.specification ?? "").trim() !== "").length;
  const filledCount = headerFilled + specFilled;
  const totalCount  = 7;

  const handleHeader = (field, value) => onChange("header", field, value);
  const handleSpec   = (rowId, value)  => onChange("specs",  rowId,  value);

  return (
    <ProcessCard sx={{ animationDelay: `${animDelay}ms` }}>
      {/* ── Card header ── */}
      <ProcessCardHeader>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
            background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 3px 10px ${alpha(BRAND.solid, 0.3)}`,
            animation: `${pulseBlue} 3s ease-in-out infinite`,
          }}>
            <BubbleChartRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
                Particle Size Distribution Details
              </Typography>
              <Chip label={`#${instanceId}`} size="small" sx={{
                height: 18, fontSize: "0.6rem", fontWeight: 700,
                background: alpha(BRAND.solid, 0.1), color: BRAND.solid,
                border: `1px solid ${alpha(BRAND.solid, 0.25)}`,
              }} />
            </Stack>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
              Record motor, batch, and particle distribution specifications
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" gap={1} alignItems="center">
          <FormProgressChip
            filledCount={filledCount}
            totalCount={totalCount}
            accentColor={BRAND.accent}
            warnColor={BRAND.warn}
            completeLabel={SOLID_PREP_TEXT.ALL_FILLED}
            suffixLabel={SOLID_PREP_TEXT.FILLED_SUFFIX}
          />
          <RemoveProcessButton
            onClick={onRemove}
            dangerColor={BRAND.danger}
            tooltip={SOLID_PREP_TEXT.REMOVE_PROCESS_TOOLTIP}
          />
        </Stack>
      </ProcessCardHeader>

      {/* ── Top static fields ── */}
      <Box sx={{
        px: 2.5, py: 2,
        background: alpha(BRAND.surface, 0.5),
        borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
      }}>
        <Stack direction={{ xs: "column", sm: "row" }} gap={2.5} flexWrap="wrap" alignItems="flex-end">

          {/* Motor ID */}
          <Box>
            <Typography sx={{
              fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.07em",
              textTransform: "uppercase", color: BRAND.textSub, mb: 0.7,
            }}>
              Motor ID
            </Typography>
            <TextField
              size="small"
              value={header.motorId}
              onChange={(e) => handleHeader("motorId", e.target.value)}
              placeholder="Enter Motor ID"
              sx={inputSx(180)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MemoryRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Thin divider */}
          <Box sx={{ height: 34, width: "1px", background: alpha(BRAND.border, 0.7), display: { xs: "none", sm: "block" } }} />

          {/* Date */}
          <Box>
            <Typography sx={{
              fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.07em",
              textTransform: "uppercase", color: BRAND.textSub, mb: 0.7,
            }}>
              Date
            </Typography>
            <TextField
              size="small"
              type="date"
              value={header.date}
              onChange={(e) => handleHeader("date", e.target.value)}
              sx={{
                ...inputSx(170),
                "& .MuiInputBase-input": { padding: "6px 10px", fontSize: "0.8rem" },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonthRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Thin divider */}
          <Box sx={{ height: 34, width: "1px", background: alpha(BRAND.border, 0.7), display: { xs: "none", sm: "block" } }} />

          {/* Grinding Batch ID */}
          <Box>
            <Typography sx={{
              fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.07em",
              textTransform: "uppercase", color: BRAND.textSub, mb: 0.7,
            }}>
              Grinding Batch ID
            </Typography>
            <TextField
              size="small"
              value={header.grindingBatchId}
              onChange={(e) => handleHeader("grindingBatchId", e.target.value)}
              placeholder="Enter Batch ID"
              sx={inputSx(180)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TagRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Stack>
      </Box>

      {/* ── PSD table ── */}
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 420 }}>
          <TableHead>
            <TableRow>
              <TH sx={{ minWidth: 220 }}>PSD / PS</TH>
              <TH sx={{ minWidth: 200 }}>Specification</TH>
            </TableRow>
          </TableHead>

          <TableBody>
            {PSD_ROWS.map((row, idx) => (
              <TableRow
                key={row.id}
                sx={{
                  background: idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55),
                  "&:hover": { background: alpha(BRAND.solid, 0.025) },
                  "&:last-child td": { borderBottom: "none" },
                }}
              >
                {/* PSD / PS label */}
                <TD>
                  <Stack direction="row" alignItems="center" gap={1.2}>
                    <Box sx={{
                      width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
                      background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 1px 4px ${alpha(BRAND.solid, 0.3)}`,
                    }}>
                      <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>
                        {idx + 1}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text }}>
                      {row.label}
                    </Typography>
                  </Stack>
                </TD>

                {/* Specification input */}
                <TD>
                  <TextField
                    size="small"
                    value={specs[row.id]?.specification ?? ""}
                    onChange={(e) => handleSpec(row.id, e.target.value)}
                    placeholder="Enter specification"
                    sx={inputSx(200)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TuneRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </TD>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </ProcessCard>
  );
};

// ─── Aluminium Processing form ────────────────────────────────────────────────
const AlProcessingForm = ({ instanceId, data, onChange, onRemove, animDelay = 0 }) => {
  const allValues = [
    data.screenMesh?.parameter,      data.screenMesh?.time,      data.screenMesh?.remarks,
    data.foreignParticle?.observed,  data.foreignParticle?.time, data.foreignParticle?.remarks,
    data.collectedQty?.parameter,    data.collectedQty?.time,    data.collectedQty?.remarks,
  ];
  const filledCount = allValues.filter((v) => String(v ?? "").trim() !== "").length;
  const totalCount  = allValues.length; // 9

  // Shared compact input helpers
  const paramInput = (rowId) => (
    <TextField size="small"
      value={data[rowId]?.parameter ?? ""}
      onChange={(e) => onChange(rowId, "parameter", e.target.value)}
      placeholder="Enter value" multiline minRows={1} maxRows={3}
      sx={{ ...inputSx(170), "& .MuiInputBase-input": { padding: "5px 8px", fontSize: "0.8rem", lineHeight: 1.5 } }}
      InputProps={{ startAdornment: <InputAdornment position="start"><TuneRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment> }}
    />
  );

  const timeInput = (rowId) => (
    <TextField size="small" type="number"
      value={data[rowId]?.time ?? ""}
      onChange={(e) => onChange(rowId, "time", e.target.value)}
      placeholder="e.g. 30" sx={inputSx(120)}
      InputProps={{
        startAdornment: <InputAdornment position="start"><TimerRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment>,
        endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>min</Typography></InputAdornment>,
      }}
    />
  );

  const remarksInput = (rowId) => (
    <TextField size="small"
      value={data[rowId]?.remarks ?? ""}
      onChange={(e) => onChange(rowId, "remarks", e.target.value)}
      placeholder={SOLID_PREP_TEXT.REMARKS_REF_PLACEHOLDER} multiline minRows={1} maxRows={3}
      sx={{ ...inputSx(195), "& .MuiInputBase-input": { padding: "5px 8px", fontSize: "0.78rem", lineHeight: 1.5 } }}
      InputProps={{ startAdornment: <InputAdornment position="start"><NotesRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment> }}
    />
  );

  const stepBadge = (n) => (
    <Box sx={{
      width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
      background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      mt: 0.15, boxShadow: `0 1px 4px ${alpha(BRAND.solid, 0.3)}`,
    }}>
      <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>{n}</Typography>
    </Box>
  );

  const rowBg = (idx) => idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55);

  return (
    <ProcessCard sx={{ animationDelay: `${animDelay}ms` }}>
      {/* ── Header ── */}
      <ProcessCardHeader>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
            background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 3px 10px ${alpha(BRAND.solid, 0.3)}`,
            animation: `${pulseBlue} 3s ease-in-out infinite`,
          }}>
            <MemoryRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
                Aluminium Processing
              </Typography>
              <Chip label={`#${instanceId}`} size="small" sx={{
                height: 18, fontSize: "0.6rem", fontWeight: 700,
                background: alpha(BRAND.solid, 0.1), color: BRAND.solid,
                border: `1px solid ${alpha(BRAND.solid, 0.25)}`,
              }} />
            </Stack>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
              Record screening parameters and aluminium processing observations
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" gap={1} alignItems="center">
          <FormProgressChip
            filledCount={filledCount}
            totalCount={totalCount}
            accentColor={BRAND.accent}
            warnColor={BRAND.warn}
            completeLabel={SOLID_PREP_TEXT.ALL_FILLED}
            suffixLabel={SOLID_PREP_TEXT.FILLED_SUFFIX}
          />
          <RemoveProcessButton
            onClick={onRemove}
            dangerColor={BRAND.danger}
            tooltip={SOLID_PREP_TEXT.REMOVE_PROCESS_TOOLTIP}
          />
        </Stack>
      </ProcessCardHeader>

      {/* ── Table ── */}
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TH sx={{ minWidth: 230 }}>Operation</TH>
              <TH sx={{ minWidth: 200 }}>Parameter</TH>
              <TH sx={{ minWidth: 140 }}>Time</TH>
              <TH sx={{ minWidth: 200 }}>Remarks / Reference No.</TH>
            </TableRow>
          </TableHead>

          <TableBody>

            {/* ── Row 1: Screen Mesh Opening / Size ── */}
            <TableRow sx={{ background: rowBg(0), "&:hover": { background: alpha(BRAND.solid, 0.025) } }}>
              <TD>
                <Stack direction="row" alignItems="flex-start" gap={1.2}>
                  {stepBadge(1)}
                  <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text, lineHeight: 1.35, pt: 0.1 }}>
                    Screen Mesh Opening / Size
                  </Typography>
                </Stack>
              </TD>
              <TD>{paramInput("screenMesh")}</TD>
              <TD>{timeInput("screenMesh")}</TD>
              <TD>{remarksInput("screenMesh")}</TD>
            </TableRow>

            {/* ── Row 2: Foreign Particle — Yes / No radio ── */}
            <TableRow sx={{ background: rowBg(1), "&:hover": { background: alpha(BRAND.solid, 0.025) } }}>
              <TD>
                <Stack direction="row" alignItems="flex-start" gap={1.2}>
                  {stepBadge(2)}
                  <Box sx={{ pt: 0.1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text, lineHeight: 1.35 }}>
                      Any Foreign particle observed during screening
                    </Typography>
                  </Box>
                </Stack>
              </TD>
              <TD>
                {/* Yes / No radio group */}
                <Box sx={{
                  display: "inline-flex", borderRadius: 2, overflow: "hidden",
                  border: `1.5px solid ${alpha(BRAND.border, 0.8)}`,
                  background: BRAND.surface,
                }}>
                  {["Yes", "No"].map((opt) => {
                    const selected = data.foreignParticle?.observed === opt.toLowerCase();
                    return (
                      <Box
                        key={opt}
                        onClick={() => onChange("foreignParticle", "observed", opt.toLowerCase())}
                        sx={{
                          px: 2.2, py: 0.7, cursor: "pointer",
                          fontWeight: 700, fontSize: "0.78rem",
                          userSelect: "none",
                          borderRight: opt === "Yes" ? `1px solid ${alpha(BRAND.border, 0.8)}` : "none",
                          transition: "all 0.18s",
                          background: selected
                            ? opt === "Yes"
                              ? `linear-gradient(135deg, ${BRAND.danger}, #E74C3C)`
                              : `linear-gradient(135deg, ${BRAND.accent}, #1ABC9C)`
                            : "transparent",
                          color: selected ? "#fff" : BRAND.textSub,
                          boxShadow: selected ? `inset 0 1px 3px rgba(0,0,0,0.15)` : "none",
                        }}
                      >
                        {opt}
                      </Box>
                    );
                  })}
                </Box>
                {/* Hint when not yet selected */}
                {!data.foreignParticle?.observed && (
                  <Typography sx={{ fontSize: "0.67rem", color: alpha(BRAND.textSub, 0.65), mt: 0.8 }}>
                    Select Yes or No
                  </Typography>
                )}
              </TD>
              <TD>{timeInput("foreignParticle")}</TD>
              <TD>{remarksInput("foreignParticle")}</TD>
            </TableRow>

            {/* ── Row 3: Collected Quantity (Kg) ── */}
            <TableRow sx={{
              background: rowBg(2),
              "&:hover": { background: alpha(BRAND.solid, 0.025) },
              "& td": { borderBottom: "none" },
            }}>
              <TD>
                <Stack direction="row" alignItems="flex-start" gap={1.2}>
                  {stepBadge(3)}
                  <Stack sx={{ pt: 0.1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text, lineHeight: 1.35 }}>
                      Collected Quantity
                    </Typography>
                    <Chip label="Kg" size="small" sx={{
                      mt: 0.4, height: 17, width: "fit-content",
                      fontSize: "0.6rem", fontWeight: 700,
                      background: alpha(BRAND.solid, 0.08), color: BRAND.solid,
                      border: `1px solid ${alpha(BRAND.solid, 0.2)}`,
                    }} />
                  </Stack>
                </Stack>
              </TD>
              <TD>
                <TextField size="small" type="number"
                  value={data.collectedQty?.parameter ?? ""}
                  onChange={(e) => onChange("collectedQty", "parameter", e.target.value)}
                  placeholder="e.g. 25.5"
                  sx={inputSx(160)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><MonitorWeightRoundedIcon sx={{ color: alpha(BRAND.solid, 0.65) }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>Kg</Typography></InputAdornment>,
                  }}
                />
              </TD>
              <TD>{timeInput("collectedQty")}</TD>
              <TD>{remarksInput("collectedQty")}</TD>
            </TableRow>

          </TableBody>
        </Table>
      </TableContainer>
    </ProcessCard>
  );
};

// ─── Generic placeholder for processes not yet implemented ────────────────────
const ProcessPlaceholder = ({ processLabel, Icon, instanceId, onRemove, animDelay = 0 }) => (
  <ProcessCard sx={{ animationDelay: `${animDelay}ms` }}>
    <ProcessCardHeader>
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Box sx={{
          width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
          background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 3px 10px ${alpha(BRAND.solid, 0.28)}`,
        }}>
          <Icon sx={{ color: "#fff", fontSize: 18 }} />
        </Box>
        <Box>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
              {processLabel}
            </Typography>
            <Chip
              label={`#${instanceId}`}
              size="small"
              sx={{
                height: 18, fontSize: "0.6rem", fontWeight: 700,
                background: alpha(BRAND.solid, 0.1), color: BRAND.solid,
                border: `1px solid ${alpha(BRAND.solid, 0.25)}`,
              }}
            />
          </Stack>
          <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
            Form coming next — structure will be defined
          </Typography>
        </Box>
      </Stack>

      <RemoveProcessButton
        onClick={onRemove}
        dangerColor={BRAND.danger}
        tooltip={SOLID_PREP_TEXT.REMOVE_PROCESS_TOOLTIP}
      />
    </ProcessCardHeader>

    <Box sx={{
      py: 4, textAlign: "center",
      background: alpha(BRAND.surface, 0.4),
    }}>
      <Icon sx={{ fontSize: 30, color: alpha(BRAND.solid, 0.22), mb: 0.8 }} />
      <Typography sx={{ fontWeight: 600, color: BRAND.textSub, fontSize: "0.84rem" }}>
        {processLabel} form is coming next
      </Typography>
      <Typography sx={{ fontSize: "0.72rem", color: alpha(BRAND.textSub, 0.65), mt: 0.4 }}>
        This card is added to the session and will hold the form once built
      </Typography>
    </Box>
  </ProcessCard>
);

// ─── SolidPreparation (main component) ───────────────────────────────────────
/**
 * Props (wired from RawMaterialPrepPage):
 *   data             object   — active batch
 *   isEditMode       bool
 *   onBlocksChange   (blocks) => void  — for parent lock tracking
 *   onBack           () => void
 */
const SolidPreparation = ({
  data          = {},
  selectedMaterialCode = "",
  initialInstances = [],
  isEditMode    = false,
  onBlocksChange,
  onBack,
}) => {
  const {
    selectedProcess,
    setSelectedProcess,
    processInstances,
    handleAdd,
    handleRemove,
    handleAPBlendingChange,
    handleBlendingCumDryingChange,
    handleDryingRVDChange,
    handleDryingOvenChange,
    handlePSDChange,
    handleAlProcessingChange,
  } = useSolidPreparationHook(initialInstances, onBlocksChange);

  const materialCode = String(selectedMaterialCode ?? "").trim();
  const { schema, loading, error, usedFallback } = useRawMaterialProcessingSchema(materialCode);

  const savedSchemaPayload = React.useMemo(() => {
    const saved = initialInstances.find((inst) => inst.processKey === "schema_driven");
    return saved?.data as { gradeCode?: string; sectionData?: Record<string, Record<string, unknown>[]> } | undefined;
  }, [initialInstances]);

  if (materialCode) {
    if (loading) {
      return (
        <Box sx={{ py: 5, textAlign: "center" }}>
          <CircularProgress size={28} sx={{ color: BRAND.solid }} />
          <Typography sx={{ mt: 1.2, fontSize: "0.82rem", color: BRAND.textSub }}>
            Loading processing schema…
          </Typography>
        </Box>
      );
    }

    if (schema) {
      return (
        <SchemaDrivenSolidPreparation
          schema={schema}
          usedFallback={usedFallback}
          initialPayload={savedSchemaPayload}
          onBlocksChange={onBlocksChange}
        />
      );
    }

  }

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      {materialCode && error && (
        <Box sx={{ mb: 2, py: 1.5, px: 2, borderRadius: 2, border: `1px dashed ${alpha(BRAND.border, 0.9)}` }}>
          <Typography sx={{ fontSize: "0.82rem", color: BRAND.danger }}>{error}</Typography>
          <Typography sx={{ fontSize: "0.75rem", color: BRAND.textSub, mt: 0.5 }}>
            Using standard solid process form below.
          </Typography>
        </Box>
      )}

      {/* ── Section title ── */}
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
        <Box sx={{
          width: 36, height: 36, borderRadius: "11px",
          background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 12px ${alpha(BRAND.solid, 0.3)}`,
        }}>
          <GrainRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: BRAND.text }}>
            {SOLID_PREP_TEXT.SECTION_TITLE}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.15 }}>
            {SOLID_PREP_TEXT.SECTION_SUBTITLE}
          </Typography>
        </Box>
      </Stack>

      {/* ── Process selector bar ── */}
      <Box sx={{
        p: "14px 18px", mb: 2.5, borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(BRAND.solid, 0.04)}, ${alpha(BRAND.solidLight, 0.02)})`,
        border: `1.5px dashed ${alpha(BRAND.solid, 0.28)}`,
      }}>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} alignItems={{ sm: "center" }} flexWrap="wrap">

          {/* Label */}
          <Typography sx={{
            fontSize: "0.72rem", fontWeight: 700, color: BRAND.solid,
            letterSpacing: "0.03em", flexShrink: 0,
          }}>
            {SOLID_PREP_TEXT.SELECTOR_LABEL}
          </Typography>

          {/* Dropdown */}
          <TextField
            select
            size="small"
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
            sx={{
              width: 290,
              "& .MuiOutlinedInput-root": {
                borderRadius: 7, background: "#fff", fontSize: "0.82rem",
                "& fieldset":         { borderColor: BRAND.border },
                "&:hover fieldset":   { borderColor: BRAND.solidLight },
                "&.Mui-focused fieldset": { borderColor: BRAND.solid, borderWidth: 2 },
              },
              "& .MuiSelect-select": { fontWeight: selectedProcess ? 600 : 400 },
            }}
            SelectProps={{
              displayEmpty: true,
              IconComponent: ExpandMoreRoundedIcon,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TuneRoundedIcon sx={{
                    fontSize: "15px !important",
                    color: selectedProcess ? BRAND.solid : alpha(BRAND.textSub, 0.5),
                  }} />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="" disabled>
              <Typography sx={{ color: "text.disabled", fontSize: "0.82rem" }}>
                {SOLID_PREP_TEXT.SELECTOR_PLACEHOLDER}
              </Typography>
            </MenuItem>
            {SOLID_PROCESSES.map(({ key, label, Icon }) => (
              <MenuItem key={key} value={key}>
                <Stack direction="row" alignItems="center" gap={1.2}>
                  <Icon sx={{ fontSize: 16, color: BRAND.solid, flexShrink: 0 }} />
                  <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: BRAND.text }}>
                    {label}
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </TextField>

          {/* Add button */}
          <Button
            variant="contained"
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={handleAdd}
            disabled={!selectedProcess}
            sx={{
              borderRadius: 2, fontWeight: 700, fontSize: "0.78rem",
              textTransform: "none", px: 2.2, py: "7px",
              background: `linear-gradient(135deg, ${BRAND.solid}, ${BRAND.solidLight})`,
              boxShadow: `0 3px 10px ${alpha(BRAND.solid, 0.3)}`,
              whiteSpace: "nowrap",
              "&:hover": {
                boxShadow: `0 5px 14px ${alpha(BRAND.solid, 0.4)}`,
                transform: "translateY(-1px)",
              },
              "&:disabled": { background: BRAND.border, boxShadow: "none", color: "#fff" },
              transition: "all 0.2s",
            }}
          >
            {SOLID_PREP_TEXT.ADD_PROCESS}
          </Button>

          {/* Hint */}
          <Stack direction="row" alignItems="center" gap={0.5}>
            <InfoOutlinedIcon sx={{ fontSize: 13, color: alpha(BRAND.textSub, 0.6) }} />
            <Typography sx={{ fontSize: "0.68rem", color: alpha(BRAND.textSub, 0.75) }}>
              {SOLID_PREP_TEXT.SELECTOR_HINT}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* ── Process cards / empty state ── */}
      {processInstances.length === 0 ? (
        <Box sx={{
          py: 6, borderRadius: 3, textAlign: "center",
          border: `1.5px dashed ${alpha(BRAND.border, 0.8)}`,
          background: alpha(BRAND.surface, 0.5),
        }}>
          <GrainRoundedIcon sx={{ fontSize: 34, color: alpha(BRAND.solid, 0.25), mb: 1.2 }} />
          <Typography sx={{ fontWeight: 700, color: BRAND.textSub, fontSize: "0.9rem" }}>
            {SOLID_PREP_TEXT.EMPTY_TITLE}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: alpha(BRAND.textSub, 0.65), mt: 0.5 }}>
            {SOLID_PREP_TEXT.EMPTY_SUBTITLE}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2.5}>
          {processInstances.map((inst, idx) => {
            const processMeta = SOLID_PROCESSES.find((p) => p.key === inst.processKey);
            const animDelay   = idx * 60;

            if (inst.processKey === "ap_blending") {
              return (
                <APBlendingForm
                  key={inst.instanceId}
                  instanceId={inst.instanceId}
                  data={inst.data}
                  animDelay={animDelay}
                  onChange={(rowId, field, value) =>
                    handleAPBlendingChange(inst.instanceId, rowId, field, value)
                  }
                  onRemove={() => handleRemove(inst.instanceId)}
                />
              );
            }

            if (inst.processKey === "blending_cum_drying") {
              return (
                <BlendingCumDryingForm
                  key={inst.instanceId}
                  instanceId={inst.instanceId}
                  data={inst.data}
                  animDelay={animDelay}
                  onChange={(field, value) =>
                    handleBlendingCumDryingChange(inst.instanceId, field, value)
                  }
                  onRemove={() => handleRemove(inst.instanceId)}
                />
              );
            }

            if (inst.processKey === "drying_rvd") {
              return (
                <DryingRVDForm
                  key={inst.instanceId}
                  instanceId={inst.instanceId}
                  data={inst.data}
                  animDelay={animDelay}
                  onChange={(rowId, fieldKey, value) =>
                    handleDryingRVDChange(inst.instanceId, rowId, fieldKey, value)
                  }
                  onRemove={() => handleRemove(inst.instanceId)}
                />
              );
            }

            if (inst.processKey === "drying_oven") {
              return (
                <DryingOvenForm
                  key={inst.instanceId}
                  instanceId={inst.instanceId}
                  data={inst.data}
                  animDelay={animDelay}
                  onChange={(rowId, fieldKey, value) =>
                    handleDryingOvenChange(inst.instanceId, rowId, fieldKey, value)
                  }
                  onRemove={() => handleRemove(inst.instanceId)}
                />
              );
            }

            if (inst.processKey === "psd") {
              return (
                <PSDForm
                  key={inst.instanceId}
                  instanceId={inst.instanceId}
                  data={inst.data}
                  animDelay={animDelay}
                  onChange={(section, key, value) =>
                    handlePSDChange(inst.instanceId, section, key, value)
                  }
                  onRemove={() => handleRemove(inst.instanceId)}
                />
              );
            }

            if (inst.processKey === "al_processing") {
              return (
                <AlProcessingForm
                  key={inst.instanceId}
                  instanceId={inst.instanceId}
                  data={inst.data}
                  animDelay={animDelay}
                  onChange={(rowId, fieldKey, value) =>
                    handleAlProcessingChange(inst.instanceId, rowId, fieldKey, value)
                  }
                  onRemove={() => handleRemove(inst.instanceId)}
                />
              );
            }

            // All other processes — placeholder until built
            return (
              <ProcessPlaceholder
                key={inst.instanceId}
                processLabel={processMeta?.label ?? inst.processKey}
                Icon={processMeta?.Icon ?? ScienceRoundedIcon}
                instanceId={inst.instanceId}
                animDelay={animDelay}
                onRemove={() => handleRemove(inst.instanceId)}
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default SolidPreparation;
