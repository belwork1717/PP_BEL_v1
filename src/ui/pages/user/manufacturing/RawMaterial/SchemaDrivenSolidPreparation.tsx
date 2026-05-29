import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import type { RawMaterialProcessingSchema } from "../../../../../data/models/user/rawMaterialProcessingSchema.types";
import { SOLID_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/rawMaterialPreparation_theme";
import {
  buildInitialSectionData,
  isPresetTableCell,
  schemaSectionHasUserData,
} from "../../../../../hooks/user/manufacturing/rawMaterialProcessingSchemaUtils";

const BRAND = SOLID_PREP_BRAND;

const inputSx = (width: number | string = 140) => ({
  width,
  "& .MuiOutlinedInput-root": {
    borderRadius: 7,
    background: BRAND.surface,
    fontSize: "0.8rem",
    transition: "all 0.18s",
    "& fieldset": { borderColor: BRAND.border },
    "&:hover fieldset": { borderColor: BRAND.solidLight },
    "&.Mui-focused fieldset": { borderColor: BRAND.solid, borderWidth: 2 },
  },
  "& .MuiInputBase-input": {
    fontWeight: 500,
    color: BRAND.text,
    padding: "6px 10px",
    fontSize: "0.8rem",
  },
});

type SchemaDrivenSolidPreparationProps = {
  schema: RawMaterialProcessingSchema;
  usedFallback?: boolean;
  initialPayload?: {
    gradeCode?: string;
    sectionData?: Record<string, Record<string, unknown>[]>;
  };
  onBlocksChange?: (blocks: Array<{ instanceId: number; processKey: string; data: unknown }>) => void;
};

const SchemaDrivenSolidPreparation = ({
  schema,
  usedFallback = false,
  initialPayload,
  onBlocksChange,
}: SchemaDrivenSolidPreparationProps) => {
  const grades = schema.rawMaterialDetails.availableGrades ?? [];
  const defaultGrade = grades[0]?.gradeCode ?? "";

  const [gradeCode, setGradeCode] = useState(initialPayload?.gradeCode ?? defaultGrade);
  const [sectionData, setSectionData] = useState<Record<string, Record<string, unknown>[]>>(() =>
    initialPayload?.sectionData ?? buildInitialSectionData(schema.sections)
  );

  useEffect(() => {
    setGradeCode(initialPayload?.gradeCode ?? defaultGrade);
    setSectionData(initialPayload?.sectionData ?? buildInitialSectionData(schema.sections));
  }, [schema.rawMaterialDetails.materialCode, initialPayload, defaultGrade]);

  const materialCode = schema.rawMaterialDetails.materialCode;

  useEffect(() => {
    if (!onBlocksChange) return;
    const hasData = schemaSectionHasUserData(sectionData);
    if (!hasData) {
      onBlocksChange([]);
      return;
    }
    onBlocksChange([
      {
        instanceId: 1,
        processKey: "schema_driven",
        data: { materialCode, gradeCode, sectionData },
      },
    ]);
  }, [sectionData, gradeCode, materialCode, onBlocksChange]);

  const updateRowField = (sectionId: string, rowIdx: number, key: string, value: string) => {
    setSectionData((prev) => {
      const rows = [...(prev[sectionId] ?? [])];
      rows[rowIdx] = { ...(rows[rowIdx] ?? {}), [key]: value };
      return { ...prev, [sectionId]: rows };
    });
  };

  const addRow = (sectionId: string) => {
    setSectionData((prev) => ({ ...prev, [sectionId]: [...(prev[sectionId] ?? []), {}] }));
  };

  const metaLine = useMemo(() => {
    const parts = [schema.screen, schema.module].filter(Boolean);
    return parts.join(" · ");
  }, [schema.module, schema.screen]);

  return (
    <Stack spacing={2}>
      <Box sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND.border, 0.7)}`, p: 1.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 0.5 }}>
          {schema.rawMaterialDetails.materialName} ({schema.rawMaterialDetails.materialCode})
        </Typography>
        {metaLine ? (
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mb: usedFallback ? 0.5 : 1 }}>
            {metaLine}
          </Typography>
        ) : null}
        {usedFallback ? (
          <Typography sx={{ fontSize: "0.7rem", color: BRAND.warn, mb: 1 }}>
            Showing offline schema preview until API is connected.
          </Typography>
        ) : null}
        {grades.length > 0 && (
          <TextField
            select
            size="small"
            label="Grade"
            value={gradeCode}
            onChange={(e) => setGradeCode(e.target.value)}
            sx={{ width: 260 }}
          >
            {grades.map((grade) => (
              <MenuItem key={grade.gradeCode} value={grade.gradeCode}>
                {grade.gradeName}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      {schema.sections.map((section) => {
        const rows = sectionData[section.sectionId] ?? [];
        const isDynamicGroup = section.type === "dynamic-group";
        const isTable = section.type === "table";

        return (
          <Box
            key={section.sectionId}
            sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND.border, 0.7)}`, p: 1.5 }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.2}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.86rem" }}>{section.title}</Typography>
              {section.addRowAllowed && (
                <Button size="small" variant="outlined" onClick={() => addRow(section.sectionId)}>
                  Add Row
                </Button>
              )}
            </Stack>

            {isDynamicGroup &&
              rows.map((row, rowIdx) => (
                <Stack
                  key={`${section.sectionId}-${rowIdx}`}
                  direction={{ xs: "column", sm: "row" }}
                  gap={1.5}
                  mb={1.25}
                  flexWrap="wrap"
                >
                  {section.fields?.map((field) => {
                    const fieldLabel = field.unit ? `${field.label} (${field.unit})` : field.label;
                    const isWideLabel = fieldLabel.length > 22;
                    return (
                      <Box
                        key={field.key}
                        sx={{
                          minWidth: isWideLabel ? 240 : 180,
                          flex: isWideLabel ? "1 1 240px" : "1 1 180px",
                          maxWidth: isWideLabel ? 320 : 260,
                        }}
                      >
                        <Typography
                          component="label"
                          sx={{
                            display: "block",
                            fontSize: "0.67rem",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            color: BRAND.textSub,
                            mb: 0.6,
                            lineHeight: 1.35,
                          }}
                        >
                          {fieldLabel}
                        </Typography>
                        <TextField
                          size="small"
                          fullWidth
                          type={field.type === "number" ? "number" : "text"}
                          placeholder="Enter value"
                          value={String(row[field.key] ?? "")}
                          onChange={(e) => updateRowField(section.sectionId, rowIdx, field.key, e.target.value)}
                          sx={inputSx("100%")}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              ))}

            {isTable && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {section.columns?.map((col) => (
                        <TableCell key={col.key} sx={{ fontWeight: 700 }}>
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, rowIdx) => (
                      <TableRow key={`${section.sectionId}-${rowIdx}`}>
                        {section.columns?.map((col, colIdx) => {
                          if (col.key === "srNo") {
                            return <TableCell key={col.key}>{String(row.srNo ?? rowIdx + 1)}</TableCell>;
                          }

                          const presetCell = isPresetTableCell(section.sectionId, col.key, row);
                          if (presetCell || col.readonly) {
                            const displayText =
                              col.key === "setParameter"
                                ? String(row.displayValue ?? row[col.key] ?? "")
                                : String(row[col.key] ?? "");
                            return (
                              <TableCell key={`${col.key}-${colIdx}`}>
                                <Typography
                                  sx={{
                                    fontSize: "0.78rem",
                                    color: BRAND.text,
                                    whiteSpace: col.key === "setParameter" ? "pre-line" : "normal",
                                    lineHeight: 1.45,
                                  }}
                                >
                                  {displayText}
                                </Typography>
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell key={`${col.key}-${colIdx}`}>
                              <TextField
                                size="small"
                                fullWidth
                                type={
                                  col.type === "number"
                                    ? "number"
                                    : col.type === "datetime"
                                      ? "datetime-local"
                                      : "text"
                                }
                                value={String(row[col.key] ?? "")}
                                onChange={(e) =>
                                  updateRowField(section.sectionId, rowIdx, col.key, e.target.value)
                                }
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        );
      })}
    </Stack>
  );
};

export default SchemaDrivenSolidPreparation;
