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
import StackRow from "../../../../components/common/StackRow";
import type { LotCertificate } from "../../../../../data/models/user/RawMaterialProcurementModel";
import {
  SpecificationBlock,
  SpecificationRow,
} from "../../../../../hooks/user/sourcing/useRawMaterialSpecificationForm";

const {
  delete: DeleteOutlineRoundedIcon,
  science: ScienceRoundedIcon,
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

type MaterialSpecificationBlockProps = {
  block: SpecificationBlock;
  index: number;
  createLotMode?: boolean;
  onUpdate: (index: number, updatedBlock: SpecificationBlock) => void;
  onRemove: (index: number) => void;
  theme: any;
};

function useMaterialBlockState(
  block: SpecificationBlock,
  index: number,
  onUpdate: (index: number, updatedBlock: SpecificationBlock) => void
) {
  const handleCellChange = useCallback(
    (rowIndex: number, field: keyof SpecificationRow, value: string) => {
      const updatedRows = block.rows.map((row, currentIndex) =>
        currentIndex !== rowIndex ? row : { ...row, [field]: value }
      );
      onUpdate(index, { ...block, rows: updatedRows });
    },
    [block, index, onUpdate]
  );

  const handleLotNoChange = useCallback(
    (value: string) => {
      onUpdate(index, { ...block, lotNo: value });
    },
    [block, index, onUpdate]
  );

  const handleBlockMeta = useCallback(
    (field: "supplyOrderNo" | "receiptDate" | "manufacturerName", value: string) => {
      onUpdate(index, { ...block, [field]: value });
    },
    [block, index, onUpdate]
  );

  const handleCertChange = useCallback(
    (certIndex: number, field: keyof LotCertificate, value: string) => {
      const certs = [...(block.certificates ?? [])];
      certs[certIndex] = { ...certs[certIndex], [field]: value };
      onUpdate(index, { ...block, certificates: certs });
    },
    [block, index, onUpdate]
  );

  const removeCertificate = useCallback(
    (certIndex: number) => {
      const certs = [...(block.certificates ?? [])];
      const removed = certs[certIndex];
      if (removed?.fileUrl?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(removed.fileUrl);
        } catch {
          /* ignore */
        }
      }
      onUpdate(index, { ...block, certificates: certs.filter((_, i) => i !== certIndex) });
    },
    [block, index, onUpdate]
  );

  const filledCount = useMemo(
    () => block.rows.filter((row) => row.analysedResult.trim() !== "").length,
    [block.rows]
  );
  const totalCount = block.rows.length;
  const allFilled = totalCount > 0 && filledCount === totalCount;

  return {
    filledCount,
    totalCount,
    allFilled,
    handleCellChange,
    handleLotNoChange,
    handleBlockMeta,
    handleCertChange,
    removeCertificate,
  };
}

const MaterialSpecificationBlock = ({
  block,
  index,
  createLotMode = false,
  onUpdate,
  onRemove,
  theme,
}: MaterialSpecificationBlockProps) => {
  const formStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const specStyles = theme.sourcing.rawMaterial.specificationForm;
  const {
    allFilled,
    filledCount,
    handleCellChange,
    handleLotNoChange,
    handleBlockMeta,
    handleCertChange,
    removeCertificate,
    totalCount,
  } = useMaterialBlockState(block, index, onUpdate);

  const certFileInputRef = useRef<HTMLInputElement>(null);
  const showAlert = useAlertStore((state) => state.showAlert);

  const handleCertificateFiles = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files;
      event.target.value = "";
      if (!fileList?.length) return;

      const incoming = Array.from(fileList);
      const next = [...(block.certificates ?? [])];
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
        onUpdate(index, { ...block, certificates: next });
      }
    },
    [block, formStrings.CERT_INVALID_FILE, index, onUpdate, showAlert]
  );

  return (
    <Box sx={{ ...theme.workflow.formElements.blockCard, ...specStyles.animatedBlockCard(index) }}>
      <Box sx={theme.workflow.formElements.blockHeader}>
        <StackRow gap={1.5}>
          <Box sx={specStyles.iconBadge}>
            <ScienceRoundedIcon sx={{ ...specStyles.whiteIcon, ...specStyles.blockScienceIcon }} />
          </Box>
          <Box>
            <Typography sx={specStyles.blockTitle}>{block.material}</Typography>
            <Typography sx={specStyles.blockMeta}>
              {block.rows.length}{" "}
              {block.rows.length === 1 ? formStrings.SPECIFICATION_LABEL : formStrings.SPECIFICATION_LABEL_PLURAL} ·{" "}
              {createLotMode ? formStrings.LOT_LABEL : formStrings.BLOCK_LABEL} #{index + 1}
            </Typography>
          </Box>
        </StackRow>

        <StackRow gap={1}>
          <Chip
            icon={
              allFilled ? (
                <CheckCircleOutlineRoundedIcon sx={{ ...specStyles.progressChipIcon, color: `${theme.palette.accent} !important` }} />
              ) : undefined
            }
            label={`${filledCount}/${totalCount} ${formStrings.RESULTS_FILLED_SUFFIX}`}
            size="small"
            sx={specStyles.progressChip(allFilled)}
          />
          <Tooltip title={formStrings.REMOVE_BLOCK_TOOLTIP}>
            <IconButton size="small" onClick={() => onRemove(index)} sx={specStyles.removeIconButton}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </StackRow>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ px: 2, py: 1.5 }}>
        <Box flex={1}>
          <Typography sx={theme.workflow.formElements.fieldLabel}>{formStrings.SUPPLY_ORDER_LABEL}</Typography>
          <TextField
            size="small"
            fullWidth
            value={block.supplyOrderNo ?? ""}
            onChange={(e) => handleBlockMeta("supplyOrderNo", e.target.value)}
            sx={theme.workflow.formElements.textField}
          />
        </Box>
        <Box flex={1}>
          <Typography sx={theme.workflow.formElements.fieldLabel}>{formStrings.RECEIPT_DATE_LABEL}</Typography>
          <TextField
            size="small"
            fullWidth
            value={block.receiptDate ?? ""}
            onChange={(e) => handleBlockMeta("receiptDate", e.target.value)}
            placeholder="DD-MM-YYYY"
            sx={theme.workflow.formElements.textField}
          />
        </Box>
        <Box flex={1}>
          <Typography sx={theme.workflow.formElements.fieldLabel}>{formStrings.MANUFACTURER_LABEL}</Typography>
          <TextField
            size="small"
            fullWidth
            value={block.manufacturerName ?? ""}
            onChange={(e) => handleBlockMeta("manufacturerName", e.target.value)}
            sx={theme.workflow.formElements.textField}
          />
        </Box>
      </Stack>

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
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.material }}>
                {formStrings.TABLE_HEADERS.MATERIAL}
              </TableCell>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.lotBatch }}>
                {createLotMode ? formStrings.TABLE_HEADERS.LOT_ID : formStrings.TABLE_HEADERS.LOT_BATCH_NO}
              </TableCell>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.specification }}>
                {formStrings.TABLE_HEADERS.SPECIFICATION}
              </TableCell>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.refRange }}>
                {formStrings.TABLE_HEADERS.REF_RANGE}
              </TableCell>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.analysedResult }}>
                {formStrings.TABLE_HEADERS.ANALYZED_RESULT}
              </TableCell>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.remarks }}>
                {formStrings.TABLE_HEADERS.REMARKS}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {block.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} sx={specStyles.dataRow(rowIndex)}>
                <TableCell sx={theme.workflow.formElements.tableCell}>
                  {rowIndex === 0 && (
                    <Chip label={block.material} size="small" sx={theme.workflow.formElements.primaryGradientChip} />
                  )}
                </TableCell>

                <TableCell sx={theme.workflow.formElements.tableCell}>
                  {rowIndex === 0 && (
                    <TextField
                      size="small"
                      fullWidth
                      value={block.lotNo}
                      onChange={(event) => handleLotNoChange(event.target.value)}
                      placeholder={formStrings.LOT_PLACEHOLDER}
                      sx={{ ...theme.workflow.formElements.cellField, ...specStyles.lotField }}
                    />
                  )}
                </TableCell>

                <TableCell sx={theme.workflow.formElements.tableCell}>
                  <Typography sx={specStyles.specText}>{row.specification}</Typography>
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
                    sx={{ ...theme.workflow.formElements.cellField, ...specStyles.analyzedField }}
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
            ))}
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
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "flex-start" }} justifyContent="space-between" gap={1.5} sx={{ mb: 1.5 }}>
          <Box>
            <Typography sx={{ ...theme.workflow.formElements.fieldLabel, mb: 0.5 }}>{formStrings.CERTIFICATES_TITLE}</Typography>
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

        {(block.certificates ?? []).length === 0 ? (
          <Box
            onClick={() => certFileInputRef.current?.click()}
            sx={{
              border: `2px dashed ${alpha(theme.palette.primaryLight ?? "#2E86C1", 0.35)}`,
              borderRadius: 2,
              py: 3,
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
            <UploadFileRoundedIcon sx={{ fontSize: 32, color: alpha(theme.palette.primaryLight ?? "#2E86C1", 0.45), mb: 1 }} />
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: theme.palette.textSub }}>
              {formStrings.UPLOAD_CERTIFICATES}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: alpha(theme.palette.textSub ?? "#5D6D7E", 0.85), mt: 0.5 }}>
              {formStrings.ADD_MORE_CERTIFICATES}
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {(block.certificates ?? []).map((cert, ci) => (
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
                  "&:hover": { borderColor: alpha(theme.palette.primaryLight ?? "#2E86C1", 0.45) },
                  transition: "border-color 0.15s",
                }}
              >
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "flex-start" }}>
                  <Stack direction="row" alignItems="flex-start" gap={1.2} sx={{ flex: 1, minWidth: 0 }}>
                    <InsertDriveFileOutlinedIcon sx={{ fontSize: 22, color: theme.palette.primaryLight, flexShrink: 0, mt: 0.25 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: theme.palette.text,
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
                            border: `1px solid ${alpha(theme.palette.primaryLight ?? "#2E86C1", 0.22)}`,
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
                    <Typography sx={{ ...theme.workflow.formElements.fieldLabel, mb: "4px" }}>{formStrings.CERT_TYPE}</Typography>
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
                transition: "all 0.18s",
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

export default MaterialSpecificationBlock;
