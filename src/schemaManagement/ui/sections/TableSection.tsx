import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { SchemaSection, SchemaThemeTokens } from "../../models/schema.types";
import { isPresetTableCell } from "../../models/schemaFormState";
import { cloneSchemaRow } from "../../models/schemaFormState";

type TableSectionProps = {
  section: SchemaSection;
  rows: Record<string, unknown>[];
  onRowsChange: (rows: Record<string, unknown>[]) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
};

const TableSection = ({ section, rows, onRowsChange, readOnly = false, theme }: TableSectionProps) => {
  const displayRows =
    rows.length > 0
      ? rows
      : (section.defaultRows ?? []).map((r) => cloneSchemaRow(r as Record<string, unknown>));

  const updateRowField = (rowIdx: number, key: string, value: string) => {
    const next = displayRows.map((row, idx) =>
      idx === rowIdx ? { ...(row ?? {}), [key]: value } : row
    );
    onRowsChange(next);
  };

  const addRow = () => {
    onRowsChange([...displayRows, {}]);
  };

  return (
    <>
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
            {displayRows.map((row, rowIdx) => (
              <TableRow key={`${section.sectionId}-${rowIdx}`}>
                {section.columns?.map((col, colIdx) => {
                  if (col.key === "srNo") {
                    return (
                      <TableCell key={col.key}>
                        {String((row as Record<string, unknown>).srNo ?? rowIdx + 1)}
                      </TableCell>
                    );
                  }

                  const presetCell = isPresetTableCell(
                    section.sectionId,
                    col.key,
                    row as Record<string, unknown>
                  );
                  if (presetCell || col.readonly || readOnly) {
                    const displayText =
                      col.key === "setParameter"
                        ? String(
                            (row as Record<string, unknown>).displayValue ??
                              (row as Record<string, unknown>)[col.key] ??
                              ""
                          )
                        : String((row as Record<string, unknown>)[col.key] ?? "");
                    return (
                      <TableCell key={`${col.key}-${colIdx}`}>
                        <Typography
                          sx={{
                            fontSize: "0.78rem",
                            color: theme.text,
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
                        value={String((row as Record<string, unknown>)[col.key] ?? "")}
                        onChange={(e) => updateRowField(rowIdx, col.key, e.target.value)}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {section.addRowAllowed && !readOnly && (
        <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={addRow}>
          Add Row
        </Button>
      )}
    </>
  );
};

export default TableSection;
