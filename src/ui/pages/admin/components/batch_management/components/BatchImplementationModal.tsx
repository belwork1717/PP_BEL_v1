import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, Stack,
  FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Zoom,
} from "@mui/material";

import { icons } from "../../../../../../app/theme";
import { STRINGS } from "../../../../../../app/config/strings";
import Input from "../../../../../components/common/Input";

const S = STRINGS.BATCH_MANAGEMENT.FORM;

interface Material {
  srNo: number;
  materialCode: string;
  materialName: string;
  lotId: string;
  requiredComposition: number;
  quantityPerPremix: number;
  revalidationDate: string;
}

interface MaterialOption {
  materialCode: string;
  materialName: string;
}

const BatchImplementationModal = ({
  open,
  onClose,
  onSave,
  editTarget,
  form,
  onFormChange,
  onMaterialsChange,
  saving,
  t,
}: any) => {
  const { modal, input } = t;
  const [editingMaterial, setEditingMaterial] = useState<number | null>(null);
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>([]);
  const [selectedMaterialCode, setSelectedMaterialCode] = useState<string>("");
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const formValid = form.identificationSheet && form.identificationSheet.date && 
                    form.identificationSheet.batchSize > 0 &&
                    form.identificationSheet.materials && 
                    form.identificationSheet.materials.length > 0;

  useEffect(() => {
    const loadMaterials = async () => {
      setLoadingMaterials(true);
      // Mock data only for batch management (admin does not have API access yet)
      const mockMaterials: MaterialOption[] = [
        {
          materialCode: "HTPB",
          materialName: "Hydroxyl-Terminated Polybutadiene",
        },
        {
          materialCode: "DOA",
          materialName: "Dioctyl Adipate",
        },
        {
          materialCode: "TDI",
          materialName: "Toluene Diisocyanate",
        },
        {
          materialCode: "TMP",
          materialName: "Trimethylolpropane",
        },
        {
          materialCode: "nBD",
          materialName: "1,4-Butanediol",
        },
      ];
      setMaterialOptions(mockMaterials);
      setLoadingMaterials(false);
    };

    loadMaterials();
  }, [open]);

  const handleIdentificationChange = (field: string) => (e: any) => {
    onFormChange(field, {
      ...form.identificationSheet,
      [field.split(".")[1]]: e.target.value,
    });
  };

  const handleAddMaterial = () => {
    if (!selectedMaterialCode) return;
    const selectedMaterial = materialOptions.find((item) => item.materialCode === selectedMaterialCode);
    if (!selectedMaterial) return;

    const newMaterial: Material = {
      srNo: (form.identificationSheet?.materials?.length ?? 0) + 1,
      materialCode: selectedMaterial.materialCode,
      materialName: selectedMaterial.materialName,
      lotId: "",
      requiredComposition: 0,
      quantityPerPremix: 0,
      revalidationDate: "",
    };
    onMaterialsChange([...(form.identificationSheet?.materials ?? []), newMaterial]);
    setSelectedMaterialCode("");
  };

  const handleRemoveMaterial = (index: number) => {
    const newMaterials = form.identificationSheet?.materials?.filter((_: any, i: number) => i !== index) ?? [];
    onMaterialsChange(newMaterials);
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const newMaterials = [...(form.identificationSheet?.materials ?? [])];
    newMaterials[index] = {
      ...newMaterials[index],
      [field]: value,
    };
    onMaterialsChange(newMaterials);
  };

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      TransitionComponent={Zoom}
      maxWidth={false}
      fullWidth
      PaperProps={{ sx: modal.paper }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={modal.header.wrapper}>
          <Box sx={modal.header.titleRow}>
            <Box sx={modal.header.iconBadge}>
              <icons.batchMgmt.batchIcon sx={modal.header.icon} />
            </Box>
            <Box>
              <Typography sx={modal.header.title}>Complete Implementation Details</Typography>
              <Typography sx={modal.header.subtitle}>
                Batch: {editTarget?.batchId || editTarget?.id}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => !saving && onClose()} sx={modal.header.closeButton}>
            <icons.batchMgmt.close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        <Stack spacing={modal.stackSpacing}>

          {/* Identification Sheet Details */}
          <Box>
            <Typography sx={modal.fieldLabel}>Identification Sheet</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <Input
                fullWidth label="Date" type="date" 
                value={form.identificationSheet?.date ?? ""}
                onChange={(e) => {
                  const newIdent = { ...form.identificationSheet, date: e.target.value };
                  onFormChange("identificationSheet", newIdent);
                }}
                size="small" sx={input} InputLabelProps={{ shrink: true }}
              />
              <Input
                fullWidth label="Batch Size" type="number"
                value={form.identificationSheet?.batchSize ?? 0}
                onChange={(e) => {
                  const newIdent = { ...form.identificationSheet, batchSize: parseInt(e.target.value) || 0 };
                  onFormChange("identificationSheet", newIdent);
                }}
                size="small" sx={input} inputProps={{ min: 1 }}
              />
            </Stack>
          </Box>

          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <Input
                fullWidth label="Bonding Sheet No"
                value={form.identificationSheet?.bondingSheetNo ?? ""}
                onChange={(e) => {
                  const newIdent = { ...form.identificationSheet, bondingSheetNo: e.target.value };
                  onFormChange("identificationSheet", newIdent);
                }}
                size="small" sx={input}
              />
              <Input
                fullWidth label="Mixer Details"
                value={form.identificationSheet?.mixerDetails ?? ""}
                onChange={(e) => {
                  const newIdent = { ...form.identificationSheet, mixerDetails: e.target.value };
                  onFormChange("identificationSheet", newIdent);
                }}
                size="small" sx={input}
              />
            </Stack>
          </Box>

          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <Input
                fullWidth label="Number of Premix" type="number"
                value={form.identificationSheet?.numberOfPremix ?? 1}
                onChange={(e) => {
                  const newIdent = { ...form.identificationSheet, numberOfPremix: parseInt(e.target.value) || 1 };
                  onFormChange("identificationSheet", newIdent);
                }}
                size="small" sx={input} inputProps={{ min: 1 }}
              />
              <Input
                fullWidth label="Remarks"
                value={form.identificationSheet?.remarks ?? ""}
                onChange={(e) => {
                  const newIdent = { ...form.identificationSheet, remarks: e.target.value };
                  onFormChange("identificationSheet", newIdent);
                }}
                size="small" sx={input}
              />
            </Stack>
          </Box>

          {/* Materials Table */}
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography sx={modal.fieldLabel}>Materials</Typography>
                <Typography variant="caption" color="textSecondary">
                  ({materialOptions.length} available)
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <FormControl sx={{ minWidth: 240 }} size="small">
                  <InputLabel>Choose material</InputLabel>
                  <Select
                    value={selectedMaterialCode}
                    label="Choose material"
                    onChange={(e: any) => setSelectedMaterialCode(e.target.value)}
                    disabled={loadingMaterials}
                  >
                    <MenuItem value=""><em>Select material</em></MenuItem>
                    {materialOptions.map((item) => (
                      <MenuItem key={item.materialCode} value={item.materialCode}>
                        {item.materialCode} - {item.materialName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button size="small" variant="outlined" onClick={handleAddMaterial} disabled={!selectedMaterialCode}>
                  + Add Material
                </Button>
              </Box>
            </Box>

            {(form.identificationSheet?.materials?.length ?? 0) > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sr. No</TableCell>
                      <TableCell>Material Code</TableCell>
                      <TableCell>Material Name</TableCell>
                      <TableCell>Lot ID / Make</TableCell>
                      <TableCell>Required Composition %</TableCell>
                      <TableCell>Qty/Premix</TableCell>
                      <TableCell>Revalidation Date</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {form.identificationSheet?.materials?.map((material: Material, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{material.srNo}</TableCell>
                        <TableCell>
                          <Input
                            value={material.materialCode}
                            disabled
                            size="small" sx={input}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={material.materialName}
                            disabled
                            size="small" sx={input}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={material.lotId}
                            onChange={(e) => handleMaterialChange(idx, "lotId", e.target.value)}
                            size="small" sx={input}
                            placeholder="Lot ID / Make"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={material.requiredComposition}
                            onChange={(e) => handleMaterialChange(idx, "requiredComposition", parseFloat(e.target.value) || 0)}
                            size="small" sx={input}
                            inputProps={{ step: 0.1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={material.quantityPerPremix}
                            onChange={(e) => handleMaterialChange(idx, "quantityPerPremix", parseFloat(e.target.value) || 0)}
                            size="small" sx={input}
                            inputProps={{ step: 0.1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={material.revalidationDate}
                            onChange={(e) => handleMaterialChange(idx, "revalidationDate", e.target.value)}
                            size="small" sx={input}
                            InputLabelProps={{ shrink: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRemoveMaterial(idx)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="textSecondary">No materials added yet</Typography>
            )}
          </Box>

        </Stack>
      </DialogContent>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <DialogActions sx={modal.actions}>
        <Button onClick={() => !saving && onClose()} sx={modal.cancelButton}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={!formValid || saving}
          sx={modal.saveButton}
        >
          {saving ? (
            <><CircularProgress size={14} sx={modal.savingSpinner} />Saving</>
          ) : "Complete Implementation"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchImplementationModal;
