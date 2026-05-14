import { useCallback, useMemo } from "react";
import {
  alpha,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
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
  add: AddRoundedIcon,
} = icons.user.sourcing.specificationFormBuilder;

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

  const handleRowBoolChange = useCallback(
    (rowIndex: number, checked: boolean) => {
      const updatedRows = block.rows.map((row, currentIndex) =>
        currentIndex !== rowIndex ? row : { ...row, isOutOfRange: checked }
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

  const addCertificate = useCallback(() => {
    const certs = [...(block.certificates ?? []), { fileName: "", fileUrl: "", certificateType: "" }];
    onUpdate(index, { ...block, certificates: certs });
  }, [block, index, onUpdate]);

  const removeCertificate = useCallback(
    (certIndex: number) => {
      const certs = (block.certificates ?? []).filter((_, i) => i !== certIndex);
      onUpdate(index, { ...block, certificates: certs });
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
    handleRowBoolChange,
    handleLotNoChange,
    handleBlockMeta,
    handleCertChange,
    addCertificate,
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
    handleRowBoolChange,
    handleLotNoChange,
    handleBlockMeta,
    handleCertChange,
    addCertificate,
    removeCertificate,
    totalCount,
  } = useMaterialBlockState(block, index, onUpdate);

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
        <TextField
          label={formStrings.SUPPLY_ORDER_LABEL}
          size="small"
          fullWidth
          value={block.supplyOrderNo ?? ""}
          onChange={(e) => handleBlockMeta("supplyOrderNo", e.target.value)}
          sx={theme.workflow.formElements.textField}
        />
        <TextField
          label={formStrings.RECEIPT_DATE_LABEL}
          size="small"
          fullWidth
          value={block.receiptDate ?? ""}
          onChange={(e) => handleBlockMeta("receiptDate", e.target.value)}
          placeholder="DD-MM-YYYY"
          sx={theme.workflow.formElements.textField}
        />
        <TextField
          label={formStrings.MANUFACTURER_LABEL}
          size="small"
          fullWidth
          value={block.manufacturerName ?? ""}
          onChange={(e) => handleBlockMeta("manufacturerName", e.target.value)}
          sx={theme.workflow.formElements.textField}
        />
      </Stack>

      <TableContainer>
        <Table size="small">
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
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader }}>{formStrings.TABLE_HEADERS.OUT_OF_RANGE}</TableCell>
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
                      value={block.lotNo}
                      onChange={(event) => handleLotNoChange(event.target.value)}
                      placeholder={formStrings.LOT_PLACEHOLDER}
                      sx={{ ...theme.workflow.formElements.textField, ...specStyles.lotField }}
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
                    value={row.analysedResult || ""}
                    onChange={(event) => handleCellChange(rowIndex, "analysedResult", event.target.value)}
                    placeholder={formStrings.ANALYZED_RESULT_PLACEHOLDER}
                    type="number"
                    sx={{ ...theme.workflow.formElements.textField, ...specStyles.analyzedField }}
                  />
                </TableCell>

                <TableCell sx={theme.workflow.formElements.tableCell} align="center">
                  <Checkbox
                    size="small"
                    checked={Boolean(row.isOutOfRange)}
                    onChange={(e) => handleRowBoolChange(rowIndex, e.target.checked)}
                  />
                </TableCell>

                <TableCell sx={theme.workflow.formElements.tableCell}>
                  <TextField
                    size="small"
                    multiline
                    minRows={1}
                    maxRows={3}
                    value={row.remarks || ""}
                    onChange={(event) => handleCellChange(rowIndex, "remarks", event.target.value)}
                    placeholder={formStrings.REMARKS_PLACEHOLDER}
                    sx={{ ...theme.workflow.formElements.textField, ...specStyles.remarksField }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${alpha(theme.palette?.border || "#ccc", 0.5)}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={{ ...theme.workflow.formElements.fieldLabel, mb: 0 }}>{formStrings.CERTIFICATES_TITLE}</Typography>
          <Button size="small" startIcon={<AddRoundedIcon />} onClick={addCertificate} sx={{ textTransform: "none" }}>
            {formStrings.ADD_CERTIFICATE}
          </Button>
        </Stack>
        <Stack spacing={1}>
          {(block.certificates ?? []).map((cert, ci) => (
            <Stack key={ci} direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
              <TextField
                size="small"
                label={formStrings.CERT_FILE_NAME}
                value={cert.fileName}
                onChange={(e) => handleCertChange(ci, "fileName", e.target.value)}
                sx={{ ...theme.workflow.formElements.textField, flex: 1 }}
              />
              <TextField
                size="small"
                label={formStrings.CERT_FILE_URL}
                value={cert.fileUrl}
                onChange={(e) => handleCertChange(ci, "fileUrl", e.target.value)}
                sx={{ ...theme.workflow.formElements.textField, flex: 2 }}
              />
              <TextField
                size="small"
                label={formStrings.CERT_TYPE}
                value={cert.certificateType}
                onChange={(e) => handleCertChange(ci, "certificateType", e.target.value)}
                sx={{ ...theme.workflow.formElements.textField, flex: 1 }}
              />
              <Tooltip title={formStrings.REMOVE_CERTIFICATE}>
                <IconButton size="small" onClick={() => removeCertificate(ci)}>
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default MaterialSpecificationBlock;
