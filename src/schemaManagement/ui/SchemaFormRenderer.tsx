import { Box, Stack, Typography, alpha } from "@mui/material";
import type { SchemaDocument, SchemaFormValues, SchemaThemeTokens } from "../models/schema.types";
import DynamicGroupSection from "./sections/DynamicGroupSection";
import FormSection from "./sections/FormSection";
import NestedGroupSection from "./sections/NestedGroupSection";
import TableSection from "./sections/TableSection";

type SchemaFormRendererProps = {
  schema: SchemaDocument;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
};

const hasNestedGroup = (section: SchemaDocument["sections"][number]) =>
  Boolean(section.lots?.fields?.length || section.drums?.fields?.length);

const SchemaFormRenderer = ({
  schema,
  values,
  onChange,
  readOnly = false,
  theme,
}: SchemaFormRendererProps) => {
  const updateSectionRows = (sectionId: string, rows: Record<string, unknown>[]) => {
    onChange({ ...values, [sectionId]: rows });
  };

  const updateFormSection = (sectionId: string, row: Record<string, unknown>) => {
    onChange({ ...values, [sectionId]: [row] });
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.border, 0.7)}`, p: 1.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 0.5 }}>
          {schema.rawMaterialDetails.materialName} ({schema.rawMaterialDetails.materialCode})
        </Typography>
        {schema.rawMaterialDetails.grade?.gradeName ? (
          <Typography sx={{ fontSize: "0.72rem", color: theme.textSub }}>
            Grade: {schema.rawMaterialDetails.grade.gradeName}
          </Typography>
        ) : null}
      </Box>

      {schema.sections.map((section) => {
        const sectionRows = (values[section.sectionId] ?? []) as Record<string, unknown>[];
        const isNested = hasNestedGroup(section);
        const isForm = section.type === "form";
        const isTable = section.type === "table";
        const isDynamicGroup = section.type === "dynamic-group" && !isNested;

        return (
          <Box
            key={section.sectionId}
            sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.border, 0.7)}`, p: 1.5 }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "0.86rem", mb: 1.2 }}>
              {section.title}
            </Typography>

            {isNested && (
              <NestedGroupSection
                section={section}
                rows={sectionRows}
                onRowsChange={(rows) => updateSectionRows(section.sectionId, rows)}
                readOnly={readOnly}
                theme={theme}
              />
            )}

            {isForm && (
              <FormSection
                section={section}
                row={(sectionRows[0] ?? {}) as Record<string, unknown>}
                onRowChange={(row) => updateFormSection(section.sectionId, row)}
                readOnly={readOnly}
                theme={theme}
              />
            )}

            {isDynamicGroup && (
              <DynamicGroupSection
                section={section}
                rows={sectionRows}
                onRowsChange={(rows) => updateSectionRows(section.sectionId, rows)}
                readOnly={readOnly}
                theme={theme}
              />
            )}

            {isTable && (
              <TableSection
                section={section}
                rows={sectionRows}
                onRowsChange={(rows) => updateSectionRows(section.sectionId, rows)}
                readOnly={readOnly}
                theme={theme}
              />
            )}
          </Box>
        );
      })}
    </Stack>
  );
};

export default SchemaFormRenderer;
