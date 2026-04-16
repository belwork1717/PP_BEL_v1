import { useCallback, useMemo } from "react";
import {
  alpha,
  Box,
  Chip,
  IconButton,
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
import {
  SpecificationBlock,
  SpecificationRow,
} from "../../../../../hooks/user/sourcing/useSpecificationFormBuilderHook";

const {
  delete: DeleteOutlineRoundedIcon,
  science: ScienceRoundedIcon,
  checkCircleOutline: CheckCircleOutlineRoundedIcon,
} = icons.user.sourcing.specificationFormBuilder;

type MaterialSpecificationBlockProps = {
  block: SpecificationBlock;
  index: number;
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
  };
}

const MaterialSpecificationBlock = ({
  block,
  index,
  onUpdate,
  onRemove,
  theme,
}: MaterialSpecificationBlockProps) => {
  const formStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const specStyles = theme.sourcing.rawMaterial.specificationForm;
  const { allFilled, filledCount, handleCellChange, handleLotNoChange, totalCount } = useMaterialBlockState(
    block,
    index,
    onUpdate
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
              {block.rows.length} {block.rows.length === 1 ? formStrings.SPECIFICATION_LABEL : formStrings.SPECIFICATION_LABEL_PLURAL} · {formStrings.BLOCK_LABEL} #{index + 1}
            </Typography>
          </Box>
        </StackRow>

        <StackRow gap={1}>
          <Chip
            icon={allFilled ? <CheckCircleOutlineRoundedIcon sx={{ ...specStyles.progressChipIcon, color: `${theme.palette.accent} !important` }} /> : undefined}
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

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.material }}>{formStrings.TABLE_HEADERS.MATERIAL}</TableCell>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.lotBatch }}>{formStrings.TABLE_HEADERS.LOT_BATCH_NO}</TableCell>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.specification }}>{formStrings.TABLE_HEADERS.SPECIFICATION}</TableCell>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.refRange }}>{formStrings.TABLE_HEADERS.REF_RANGE}</TableCell>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.analysedResult }}>{formStrings.TABLE_HEADERS.ANALYZED_RESULT}</TableCell>
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.remarks }}>{formStrings.TABLE_HEADERS.REMARKS}</TableCell>
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
    </Box>
  );
};

export default MaterialSpecificationBlock;
