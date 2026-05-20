import { useCallback, useMemo, useRef, type ChangeEvent } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { useAlertStore } from "../../../../../app/store/alertStore";
import { fileUtils } from "../../../../../utils/FileUtils";
import type { LotCertificate, MaterialLotBlock, SpecRow } from "../../../../../data/models/user/RawMaterialProcurementModel";
import {
  computeIsOutOfRange,
  isSpecRowFailed,
} from "../../../../../data/models/user/RawMaterialProcurementModel";
import MandatoryFormField, { mandatoryAsteriskSx, mandatoryFieldInputSx } from "./MandatoryFormField";
import {
  getLotFieldErrors,
  isAnalyzedResultMissing,
  type MandatoryValidationMessages,
} from "../../../../../data/models/user/rawMaterialProcurementValidation";

const {
  delete: DeleteOutlineRoundedIcon,
  checkCircleOutline: CheckCircleOutlineRoundedIcon,
  uploadFile: UploadFileRoundedIcon,
  insertDriveFile: InsertDriveFileOutlinedIcon,
  openInNew: OpenInNewRoundedIcon,
} = icons.user.sourcing.specificationFormBuilder;

const CERTIFICATE_MIME_TYPES = [
  ...fileUtils.ALLOWED_TYPES.DOCUMENTS,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/zip",
  "application/x-zip-compressed",
];

const CERT_MAX_UPLOAD_MB = 20;

function isWebCertificateUrl(url: string) {
  return /^https?:\/\//i.test(String(url ?? "").trim());
}

function fileExtensionLabel(fileName: string) {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  const parts = base.split(".");
  if (parts.length < 2) return "FILE";
  return parts.pop()!.toUpperCase().slice(0, 8);
}

function validateCertificateFile(file: File): { valid: boolean; error?: string } {
  const primary = fileUtils.validateFile(file, CERTIFICATE_MIME_TYPES, CERT_MAX_UPLOAD_MB);
  if (primary.valid) return { valid: true };
  const name = file.name.toLowerCase();
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > CERT_MAX_UPLOAD_MB) return { valid: false, error: primary.error };
  if (name.endsWith(".zip")) return { valid: true };
  return { valid: false, error: primary.error };
}

type MaterialLotSectionProps = {
  lot: MaterialLotBlock;
  lotIndex: number;
  lotCount: number;
  onUpdate: (lot: MaterialLotBlock) => void;
  onRemove: () => void;
  showFieldErrors?: boolean;
  validationMessages: MandatoryValidationMessages;
  theme: any;
};

const MaterialLotSection = ({
  lot,
  lotIndex,
  lotCount,
  onUpdate,
  onRemove,
  showFieldErrors = false,
  validationMessages,
  theme,
}: MaterialLotSectionProps) => {
  const formStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const specStyles = theme.sourcing.rawMaterial.specificationForm;
  const lotErrors = getLotFieldErrors(lot, validationMessages, showFieldErrors);
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const showAlert = useAlertStore((state) => state.showAlert);

  const filledCount = useMemo(
    () => lot.rows.filter((row) => row.analysedResult.trim() !== "").length,
    [lot.rows]
  );
  const totalCount = lot.rows.length;
  const allFilled = totalCount > 0 && filledCount === totalCount;

  const handleCellChange = useCallback(
    (rowIndex: number, field: keyof SpecRow, value: string) => {
      const updatedRows = lot.rows.map((row, currentIndex) => {
        if (currentIndex !== rowIndex) return row;
        const next = { ...row, [field]: value };
        if (field === "analysedResult") {
          next.status = null;
          next.isOutOfRange = computeIsOutOfRange(value, row.referenceRange);
        }
        return next;
      });
      onUpdate({ ...lot, rows: updatedRows });
    },
    [lot, onUpdate]
  );

  const handleLotNoChange = useCallback(
    (value: string) => {
      onUpdate({ ...lot, lotNo: value });
    },
    [lot, onUpdate]
  );

  const handleCertChange = useCallback(
    (certIndex: number, field: keyof LotCertificate, value: string) => {
      const certs = [...(lot.certificates ?? [])];
      certs[certIndex] = { ...certs[certIndex], [field]: value };
      onUpdate({ ...lot, certificates: certs });
    },
    [lot, onUpdate]
  );

  const removeCertificate = useCallback(
    (certIndex: number) => {
      const certs = [...(lot.certificates ?? [])];
      const removed = certs[certIndex];
      if (removed?.fileUrl?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(removed.fileUrl);
        } catch {
          /* ignore */
        }
      }
      onUpdate({ ...lot, certificates: certs.filter((_, i) => i !== certIndex) });
    },
    [lot, onUpdate]
  );

  const handleCertificateFiles = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files;
      event.target.value = "";
      if (!fileList?.length) return;

      const incoming = Array.from(fileList);
      const next = [...(lot.certificates ?? [])];
      let added = 0;

      for (const file of incoming) {
        const { valid, error } = validateCertificateFile(file);
        if (!valid) {
          showAlert(`${file.name}: ${error ?? formStrings.CERT_INVALID_FILE}`, "warning");
          continue;
        }
        const blobUrl = URL.createObjectURL(file);
        next.push({ fileName: file.name, fileUrl: blobUrl, certificateType: "" });
        added += 1;
      }

      if (added > 0) {
        onUpdate({ ...lot, certificates: next });
      }
    },
    [formStrings.CERT_INVALID_FILE, lot, onUpdate, showAlert]
  );

  return (
    <Box
      sx={{
        borderRadius: 1.5,
        border: `1px solid ${alpha(theme.palette?.border || "#ccc", 0.55)}`,
        overflow: "hidden",
        mb: 2,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          background: alpha(theme.palette?.primary ?? "#1B4F72", 0.04),
          borderBottom: `1px solid ${alpha(theme.palette?.border || "#ccc", 0.45)}`,
        }}
      >
        <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: theme.palette.text }}>
          {formStrings.LOT_LABEL} #{lotIndex + 1}
        </Typography>
        <Stack direction="row" alignItems="center" gap={1}>
          <Chip
            icon={
              allFilled ? (
                <CheckCircleOutlineRoundedIcon
                  sx={{ ...specStyles.progressChipIcon, color: `${theme.palette.accent} !important` }}
                />
              ) : undefined
            }
            label={`${filledCount}/${totalCount} ${formStrings.RESULTS_FILLED_SUFFIX}`}
            size="small"
            sx={specStyles.progressChip(allFilled)}
          />
          {lotCount > 1 && (
            <Tooltip title={formStrings.REMOVE_LOT_TOOLTIP}>
              <IconButton size="small" onClick={onRemove} sx={specStyles.removeIconButton}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      <Box sx={{ px: 2, py: 1.5, maxWidth: 360 }}>
        <MandatoryFormField label={formStrings.TABLE_HEADERS.LOT_ID} error={lotErrors.lotNo} theme={theme}>
          <TextField
            size="small"
            fullWidth
            value={lot.lotNo}
            onChange={(event) => handleLotNoChange(event.target.value)}
            placeholder={formStrings.LOT_PLACEHOLDER}
            error={Boolean(lotErrors.lotNo)}
            sx={mandatoryFieldInputSx(theme.workflow.formElements.textField, Boolean(lotErrors.lotNo), theme)}
          />
        </MandatoryFormField>
      </Box>

      <TableContainer
        sx={{
          mx: 2,
          mb: 1.5,
          borderRadius: 1.5,
          border: `1px solid ${alpha(theme.palette?.border || "#ccc", 0.45)}`,
          overflow: "hidden",
        }}
      >
        <Table size="small" sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.specification }}>
                {formStrings.TABLE_HEADERS.SPECIFICATION}
              </TableCell>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.refRange }}>
                {formStrings.TABLE_HEADERS.REF_RANGE}
              </TableCell>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.analysedResult }}>
                {formStrings.TABLE_HEADERS.ANALYZED_RESULT}
                <Box component="span" sx={mandatoryAsteriskSx(theme)}>
                  {" "}
                  *
                </Box>
              </TableCell>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.remarks }}>
                {formStrings.TABLE_HEADERS.REMARKS}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lot.rows.map((row, rowIndex) => {
              const rowFailed = isSpecRowFailed(row);
              const analyzedMissing = isAnalyzedResultMissing(row, showFieldErrors);
              return (
                <TableRow key={rowIndex} sx={specStyles.dataRow(rowIndex, rowFailed)}>
                  <TableCell sx={theme.workflow.formElements.tableCell}>
                    <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                      <Typography sx={specStyles.specText}>{row.specification}</Typography>
                      {rowFailed && (
                        <Chip label={formStrings.SPEC_STATUS_FAILED} size="small" sx={specStyles.failedSpecChip} />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={theme.workflow.formElements.tableCell}>
                    <Chip label={row.refRange} size="small" sx={specStyles.refRangeChip} />
                  </TableCell>
                  <TableCell sx={theme.workflow.formElements.tableCell}>
                    <TextField
                      size="small"
                      fullWidth
                      value={row.analysedResult || ""}
                      onChange={(event) => handleCellChange(rowIndex, "analysedResult", event.target.value)}
                      placeholder={formStrings.ANALYZED_RESULT_PLACEHOLDER}
                      type="number"
                      inputProps={{ step: "any" }}
                      error={analyzedMissing}
                      helperText={analyzedMissing ? formStrings.FIELD_REQUIRED_ANALYZED_RESULT : undefined}
                      FormHelperTextProps={{ sx: { mx: 0, fontSize: "0.65rem" } }}
                      sx={{
                        ...theme.workflow.formElements.cellField,
                        ...specStyles.analyzedField,
                        ...(rowFailed || analyzedMissing ? specStyles.failedAnalyzedField : {}),
                      }}
                    />
                  </TableCell>
                  <TableCell sx={theme.workflow.formElements.tableCell}>
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      minRows={1}
                      maxRows={3}
                      value={row.remarks || ""}
                      onChange={(event) => handleCellChange(rowIndex, "remarks", event.target.value)}
                      placeholder={formStrings.REMARKS_PLACEHOLDER}
                      sx={{ ...theme.workflow.formElements.multilineField, ...specStyles.remarksField }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderTop: `1px solid ${alpha(theme.palette?.border || "#ccc", 0.5)}`,
          background: alpha(theme.palette?.primary ?? "#1B4F72", 0.02),
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "flex-start" }}
          justifyContent="space-between"
          gap={1.5}
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Typography sx={{ ...theme.workflow.formElements.fieldLabel, mb: 0.5 }}>
              {formStrings.CERTIFICATES_TITLE}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, lineHeight: 1.45, maxWidth: 520 }}>
              {formStrings.CERTIFICATES_SUBTITLE}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadFileRoundedIcon sx={{ fontSize: "17px !important" }} />}
            onClick={() => certFileInputRef.current?.click()}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              flexShrink: 0,
              borderRadius: 2,
              borderColor: theme.palette.primaryLight,
              color: theme.palette.primaryLight,
              "&:hover": { background: alpha(theme.palette.primaryLight, 0.06) },
            }}
          >
            {formStrings.UPLOAD_CERTIFICATES}
          </Button>
          <input
            ref={certFileInputRef}
            type="file"
            hidden
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
            onChange={handleCertificateFiles}
          />
        </Stack>

        {(lot.certificates ?? []).length === 0 ? (
          <Box
            onClick={() => certFileInputRef.current?.click()}
            sx={{
              border: `2px dashed ${alpha(theme.palette.primaryLight ?? "#2E86C1", 0.35)}`,
              borderRadius: 2,
              py: 2.5,
              px: 2,
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.18s",
              "&:hover": {
                borderColor: alpha(theme.palette.primaryLight ?? "#2E86C1", 0.65),
                background: alpha(theme.palette.primaryLight ?? "#2E86C1", 0.04),
              },
            }}
          >
            <UploadFileRoundedIcon
              sx={{ fontSize: 28, color: alpha(theme.palette.primaryLight ?? "#2E86C1", 0.45), mb: 0.75 }}
            />
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: theme.palette.textSub }}>
              {formStrings.UPLOAD_CERTIFICATES}
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {(lot.certificates ?? []).map((cert, ci) => (
              <ListItem
                key={`${cert.fileName}-${ci}-${cert.fileUrl?.slice(0, 24) ?? ""}`}
                disableGutters
                sx={{
                  display: "block",
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 2,
                  background: alpha(theme.palette.surface ?? "#fff", theme.palette.mode === "dark" ? 0.35 : 1),
                  border: `1px solid ${alpha(theme.palette.border ?? "#ccc", 0.55)}`,
                }}
              >
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                  <Stack direction="row" alignItems="flex-start" gap={1.2} sx={{ flex: 1, minWidth: 0 }}>
                    <InsertDriveFileOutlinedIcon
                      sx={{ fontSize: 22, color: theme.palette.primaryLight, flexShrink: 0, mt: 0.25 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cert.fileName || formStrings.CERT_FILE_NAME}
                      </Typography>
                      <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap" sx={{ mt: 0.75 }}>
                        <Chip
                          label={fileExtensionLabel(cert.fileName || "file")}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            background: alpha(theme.palette.primaryLight ?? "#2E86C1", 0.1),
                            color: theme.palette.primaryLight,
                          }}
                        />
                        {isWebCertificateUrl(cert.fileUrl) && (
                          <Tooltip title={formStrings.OPEN_CERT_LINK}>
                            <IconButton
                              size="small"
                              component="a"
                              href={cert.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ color: theme.palette.primaryLight }}
                            >
                              <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                  <Box sx={{ width: { xs: "100%", md: 220 }, flexShrink: 0 }}>
                    <Typography sx={{ ...theme.workflow.formElements.fieldLabel, mb: "4px" }}>
                      {formStrings.CERT_TYPE}
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      value={cert.certificateType}
                      onChange={(e) => handleCertChange(ci, "certificateType", e.target.value)}
                      placeholder={formStrings.CERT_TYPE}
                      sx={theme.workflow.formElements.textField}
                    />
                  </Box>
                  <Tooltip title={formStrings.REMOVE_CERTIFICATE}>
                    <IconButton
                      size="small"
                      onClick={() => removeCertificate(ci)}
                      sx={{
                        alignSelf: { xs: "flex-end", md: "center" },
                        color: theme.palette.textSub,
                        "&:hover": { color: theme.palette.danger, background: alpha(theme.palette.danger, 0.08) },
                      }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </ListItem>
            ))}
            <Box
              onClick={() => certFileInputRef.current?.click()}
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 2,
                cursor: "pointer",
                border: `1.5px dashed ${alpha(theme.palette.primaryLight ?? "#2E86C1", 0.35)}`,
                display: "flex",
                alignItems: "center",
                gap: 1,
                "&:hover": {
                  borderColor: alpha(theme.palette.primaryLight ?? "#2E86C1", 0.65),
                  background: alpha(theme.palette.primaryLight ?? "#2E86C1", 0.04),
                },
              }}
            >
              <UploadFileRoundedIcon sx={{ fontSize: 17, color: alpha(theme.palette.primaryLight ?? "#2E86C1", 0.75) }} />
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: theme.palette.primaryLight }}>
                {formStrings.ADD_MORE_CERTIFICATES}
              </Typography>
            </Box>
          </List>
        )}
      </Box>
    </Box>
  );
};

export default MaterialLotSection;
