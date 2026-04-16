// src/ui/pages/user/manufacturing/RawMaterial/RawMaterialBuilderPage.tsx

import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import LinearPreparation from "./LinearPreparation";
import SolidPreparation from "./SolidPreparation";
import LiquidPreparation from "./LiquidPreparation";
import { STRINGS } from "../../../../../app/config/strings";
import { icons } from "../../../../../app/theme/icons";

const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
const { info: InfoOutlinedIcon } = icons.user.manufacturing.rawMaterial.builderPage;

const RawMaterialBuilderForm = ({
  activeBatch,
  isEditMode,
  selectedTypes,
  theme,
  handleBack,
  solidInstances,
  liquidPartA,
  liquidRows,
  linearData,
  handleSolidBlocksChange,
  handleLiquidBlocksChange,
  handleLinearBlocksChange,
  onSaveDraft,
  onSubmit,
  actionLoading,
  disableActions,
}: any) => {
  const rmTheme = theme.manufacturing.rawMaterialPrep;
  const labels = STRINGS.SOURCING.SPECIFICATION_FORM;
  const isResubmission = Boolean(isEditMode);

  return (
    <>
      {selectedTypes.solid && (
        <Box key="solid-builder" sx={rmTheme.builder.sectionContainer}>
          <SolidPreparation
            data={activeBatch as any}
            initialInstances={solidInstances}
            isEditMode={isEditMode}
            onBlocksChange={handleSolidBlocksChange}
            onBack={handleBack}
          />
        </Box>
      )}

      {selectedTypes.liquid && (
        <Box key="liquid-builder" sx={rmTheme.builder.sectionContainer}>
          <LiquidPreparation
            data={activeBatch as any}
            initialData={{
              partA: liquidPartA,
              rows: liquidRows,
            }}
            isEditMode={isEditMode}
            onBlocksChange={handleLiquidBlocksChange}
            onBack={handleBack}
          />
        </Box>
      )}

      {selectedTypes.linear && (
        <Box key="linear-builder" sx={rmTheme.builder.sectionContainer}>
          <LinearPreparation
            data={linearData}
            isEditMode={isEditMode}
            onBlocksChange={handleLinearBlocksChange}
          />
        </Box>
      )}

      {!selectedTypes.solid && !selectedTypes.liquid && !selectedTypes.linear && (
        <Box sx={rmTheme.builder.emptyStateBox}>
          <InfoOutlinedIcon sx={rmTheme.builder.emptyStateIcon} />
          <Typography sx={rmTheme.builder.emptyStateTitle}>{RM.NO_TYPE_SELECTED_TITLE}</Typography>
          <Typography sx={rmTheme.builder.emptyStateSubtitle}>{RM.NO_TYPE_SELECTED_SUBTITLE}</Typography>
        </Box>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} mt={3} justifyContent="flex-end">
        <Button
          variant="outlined"
          disabled={actionLoading || disableActions}
          onClick={onSaveDraft}
        >
          {labels.SAVE_DRAFT}
        </Button>
        <Button
          variant="contained"
          disabled={actionLoading || disableActions}
          onClick={onSubmit}
        >
          {isResubmission ? labels.RESUBMIT_APPROVAL : labels.SUBMIT_APPROVAL}
        </Button>
      </Stack>
    </>
  );
};

export default RawMaterialBuilderForm;
