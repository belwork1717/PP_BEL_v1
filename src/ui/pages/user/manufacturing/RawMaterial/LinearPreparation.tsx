// src/ui/pages/user/manufacturing/RawMaterialPrep/LinearPreparation.jsx

import React from "react";
import {
  Box, Stack, Typography, TextField, Chip, alpha,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, InputAdornment,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { icons } from "../../../../../app/theme/icons";
import { LINEAR_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/rawMaterialPreparation_theme";
import {
  LINEAR_PREP_TEXT,
  countFilledLinearFields,
  createLinearPreparationData,
} from "../../../../../hooks/user/manufacturing/linearPreparationConfig";
import useLinearPreparationHook from "../../../../../hooks/user/manufacturing/useLinearPreparationHook";
import FormProgressChip from "../../../../components/common/FormProgressChip";

const {
  blurLinear: BlurLinearRoundedIcon,
  science: ScienceRoundedIcon,
  timer: TimerRoundedIcon,
  notes: NotesRoundedIcon,
} = icons.user.manufacturing.rawMaterial.linearPreparation;

const BRAND = LINEAR_PREP_BRAND;

const slideIn = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const pulseBlue = keyframes`0%,100%{box-shadow:0 0 0 0 rgba(21,101,192,0.2)}50%{box-shadow:0 0 0 6px rgba(21,101,192,0)}`;

const SectionCard = styled(Box)(() => ({
  borderRadius: 16,
  border: `1px solid rgba(21,101,192,0.2)`,
  background: "#fff",
  overflow: "hidden",
  boxShadow: `0 2px 18px rgba(21,101,192,0.07)`,
  animation: `${slideIn} 0.35s ease both`,
  animationDelay: "0ms",
}));

const SectionHeader = styled(Box)({
  padding: "13px 20px",
  background: "linear-gradient(135deg, rgba(21,101,192,0.07), rgba(25,118,210,0.03))",
  borderBottom: "1px solid rgba(21,101,192,0.14)",
  display: "flex", alignItems: "center", justifyContent: "space-between",
});

const TH = styled(TableCell)({
  background: "linear-gradient(135deg, #1565C0, #1976D2)",
  color: "#fff", fontWeight: 700, fontSize: "0.7rem",
  letterSpacing: "0.08em", textTransform: "uppercase",
  padding: "11px 16px", whiteSpace: "nowrap", borderBottom: "none",
});

const TD = styled(TableCell)({
  padding: "12px 16px",
  borderBottom: "1px solid rgba(213,216,220,0.55)",
  verticalAlign: "middle",
});

const inputSx = (width = 140) => ({
  width,
  "& .MuiOutlinedInput-root": {
    borderRadius: 7, background: "#F4F6F8", fontSize: "0.8rem", transition: "all 0.18s",
    "& fieldset": { borderColor: "#D5D8DC" },
    "&:hover fieldset": { borderColor: "#1976D2" },
    "&.Mui-focused fieldset": { borderColor: "#1565C0", borderWidth: 2 },
    "&.Mui-focused": { background: "#fff", boxShadow: "0 0 0 3px rgba(21,101,192,0.1)" },
  },
  "& .MuiInputBase-input": { fontWeight: 500, color: "#1C2833", padding: "6px 10px", fontSize: "0.8rem" },
  "& .MuiInputAdornment-root svg": { fontSize: "14px !important" },
});

const SubBadge = ({ label }) => (
  <Box sx={{ width:17, height:17, borderRadius:"4px", flexShrink:0, background:"rgba(21,101,192,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
    <Typography sx={{ color:"#1565C0", fontSize:"0.56rem", fontWeight:800, lineHeight:1 }}>{label}</Typography>
  </Box>
);

const StepBadge = ({ n }) => (
  <Box sx={{ width:22, height:22, borderRadius:"6px", flexShrink:0, background:"linear-gradient(135deg,#1565C0,#1976D2)", display:"flex", alignItems:"center", justifyContent:"center", mt:0.15, boxShadow:"0 1px 4px rgba(21,101,192,0.3)" }}>
    <Typography sx={{ color:"#fff", fontSize:"0.62rem", fontWeight:800, lineHeight:1 }}>{n}</Typography>
  </Box>
);

const LinearPreparation = ({
  data = createLinearPreparationData(),
  isEditMode = false,
  onBlocksChange,
}) => {
  const { premix, finalMix, handlePremixChange, handleFinalMixChange } =
    useLinearPreparationHook(data, onBlocksChange);

  const TimeInput = ({ value, onChange }) => (
    <TextField size="small" type="number" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={LINEAR_PREP_TEXT.TIME_PLACEHOLDER} sx={inputSx(130)}
      InputProps={{
        startAdornment:<InputAdornment position="start"><TimerRoundedIcon sx={{color:"rgba(21,101,192,0.65)"}}/></InputAdornment>,
        endAdornment:<InputAdornment position="end"><Typography sx={{fontSize:"0.72rem",color:"#5D6D7E",fontWeight:600}}>min</Typography></InputAdornment>,
      }}
    />
  );

  const RemarksInput = ({ value, onChange }) => (
    <TextField size="small" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={LINEAR_PREP_TEXT.REMARKS_PLACEHOLDER} multiline minRows={1} maxRows={3}
      sx={{...inputSx(200),"& .MuiInputBase-input":{padding:"5px 8px",fontSize:"0.78rem",lineHeight:1.5}}}
      InputProps={{ startAdornment:<InputAdornment position="start"><NotesRoundedIcon sx={{color:"rgba(21,101,192,0.65)"}}/></InputAdornment> }}
    />
  );

  const IconBubble = ({ Icon }) => (
    <Box sx={{ width:34, height:34, borderRadius:"10px", flexShrink:0, background:"linear-gradient(135deg,#1565C0,#1976D2)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 3px 10px rgba(21,101,192,0.3)", animation:`${pulseBlue} 3s ease-in-out infinite` }}>
      <Icon sx={{ color:"#fff", fontSize:18 }} />
    </Box>
  );

  const rowBg = (i) => i % 2 === 0 ? "#fff" : "rgba(244,246,248,0.55)";

  const sectionTitleSx = { fontWeight:800, fontSize:"0.92rem", color:BRAND.text };
  const paramTextSx    = { fontWeight:600, fontSize:"0.78rem", color:BRAND.text };

  return (
    <Box sx={{ fontFamily:"'DM Sans', sans-serif" }}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
        <Box sx={{ width:36, height:36, borderRadius:"11px", background:"linear-gradient(135deg,#1565C0,#1976D2)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(21,101,192,0.3)" }}>
          <BlurLinearRoundedIcon sx={{ color:"#fff", fontSize:19 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight:800, fontSize:"0.98rem", color:BRAND.text }}>{LINEAR_PREP_TEXT.SECTION_TITLE}</Typography>
          <Typography sx={{ fontSize:"0.72rem", color:BRAND.textSub, mt:0.15 }}>{LINEAR_PREP_TEXT.SECTION_SUBTITLE}</Typography>
        </Box>
      </Stack>

      <Stack spacing={2.5}>

        {/* PART A — Premix */}
        <SectionCard sx={{ animationDelay: "0ms" }}>
          <SectionHeader>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <IconBubble Icon={ScienceRoundedIcon} />
              <Box>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography sx={sectionTitleSx}>{LINEAR_PREP_TEXT.PART_A_TITLE}</Typography>
                  <Chip label={LINEAR_PREP_TEXT.PART_A_TAG} size="small" sx={{ height:17, fontSize:"0.6rem", fontWeight:700, background:"rgba(21,101,192,0.1)", color:"#1565C0", border:"1px solid rgba(21,101,192,0.25)" }} />
                </Stack>
                <Typography sx={{ fontSize:"0.7rem", color:BRAND.textSub, mt:0.15 }}>{LINEAR_PREP_TEXT.PART_A_SUBTITLE}</Typography>
              </Box>
            </Stack>
            <FormProgressChip
              filledCount={countFilledLinearFields(premix)}
              totalCount={6}
              accentColor={BRAND.accent}
              warnColor={BRAND.warn}
              completeLabel={LINEAR_PREP_TEXT.ALL_FILLED}
              suffixLabel={LINEAR_PREP_TEXT.FILLED_SUFFIX}
            />
          </SectionHeader>
          <TableContainer sx={{ overflowX:"auto" }}>
            <Table sx={{ minWidth:800 }}>
              <TableHead>
                <TableRow>
                  <TH sx={{ minWidth:220 }}>Operation</TH>
                  <TH sx={{ minWidth:200 }}>Parameter</TH>
                  <TH sx={{ minWidth:155 }}>Time</TH>
                  <TH sx={{ minWidth:210 }}>Remarks / Lab Reference No.</TH>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ background:rowBg(0), "&:hover":{background:"rgba(21,101,192,0.025)"} }}>
                  <TD rowSpan={3} sx={{ verticalAlign:"top", pt:"15px", borderRight:"1px solid rgba(213,216,220,0.45)" }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={1} />
                      <Typography sx={{ fontWeight:700, fontSize:"0.8rem", color:BRAND.text, lineHeight:1.4, pt:0.1 }}>{LINEAR_PREP_TEXT.STEP_A_OPERATION}</Typography>
                    </Stack>
                  </TD>
                  <TD><Stack direction="row" alignItems="center" gap={0.9}><SubBadge label="a"/><Typography sx={paramTextSx}>Temperature</Typography></Stack></TD>
                  <TD><TimeInput value={premix.timeA} onChange={(v)=>handlePremixChange("timeA",v)} /></TD>
                  <TD><RemarksInput value={premix.remarksA} onChange={(v)=>handlePremixChange("remarksA",v)} /></TD>
                </TableRow>
                <TableRow sx={{ background:rowBg(1), "&:hover":{background:"rgba(21,101,192,0.025)"} }}>
                  <TD><Stack direction="row" alignItems="center" gap={0.9}><SubBadge label="b"/><Typography sx={paramTextSx}>Vacuum and Moisture</Typography></Stack></TD>
                  <TD><TimeInput value={premix.timeB} onChange={(v)=>handlePremixChange("timeB",v)} /></TD>
                  <TD><RemarksInput value={premix.remarksB} onChange={(v)=>handlePremixChange("remarksB",v)} /></TD>
                </TableRow>
                <TableRow sx={{ background:rowBg(0), "&:hover":{background:"rgba(21,101,192,0.025)"}, "& td":{borderBottom:"none"} }}>
                  <TD><Stack direction="row" alignItems="center" gap={0.9}><SubBadge label="c"/><Typography sx={paramTextSx}>RPM and Time</Typography></Stack></TD>
                  <TD><TimeInput value={premix.timeC} onChange={(v)=>handlePremixChange("timeC",v)} /></TD>
                  <TD><RemarksInput value={premix.remarksC} onChange={(v)=>handlePremixChange("remarksC",v)} /></TD>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </SectionCard>

        {/* PART B — Final Mix */}
        <SectionCard sx={{ animationDelay: "80ms" }}>
          <SectionHeader>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <IconBubble Icon={BlurLinearRoundedIcon} />
              <Box>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography sx={sectionTitleSx}>{LINEAR_PREP_TEXT.PART_B_TITLE}</Typography>
                  <Chip label={LINEAR_PREP_TEXT.PART_B_TAG} size="small" sx={{ height:17, fontSize:"0.6rem", fontWeight:700, background:"rgba(21,101,192,0.1)", color:"#1565C0", border:"1px solid rgba(21,101,192,0.25)" }} />
                </Stack>
                <Typography sx={{ fontSize:"0.7rem", color:BRAND.textSub, mt:0.15 }}>{LINEAR_PREP_TEXT.PART_B_SUBTITLE}</Typography>
              </Box>
            </Stack>
            <FormProgressChip
              filledCount={countFilledLinearFields(finalMix)}
              totalCount={4}
              accentColor={BRAND.accent}
              warnColor={BRAND.warn}
              completeLabel={LINEAR_PREP_TEXT.ALL_FILLED}
              suffixLabel={LINEAR_PREP_TEXT.FILLED_SUFFIX}
            />
          </SectionHeader>
          <TableContainer sx={{ overflowX:"auto" }}>
            <Table sx={{ minWidth:800 }}>
              <TableHead>
                <TableRow>
                  <TH sx={{ minWidth:220 }}>Operation</TH>
                  <TH sx={{ minWidth:200 }}>Parameter</TH>
                  <TH sx={{ minWidth:155 }}>Time</TH>
                  <TH sx={{ minWidth:210 }}>Remarks / Lab Reference No.</TH>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ background:rowBg(0), "&:hover":{background:"rgba(21,101,192,0.025)"} }}>
                  <TD rowSpan={2} sx={{ verticalAlign:"top", pt:"15px", borderRight:"1px solid rgba(213,216,220,0.45)" }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={1} />
                      <Typography sx={{ fontWeight:700, fontSize:"0.8rem", color:BRAND.text, lineHeight:1.4, pt:0.1 }}>{LINEAR_PREP_TEXT.STEP_B_OPERATION}</Typography>
                    </Stack>
                  </TD>
                  <TD><Stack direction="row" alignItems="center" gap={0.9}><SubBadge label="a"/><Typography sx={paramTextSx}>Time</Typography></Stack></TD>
                  <TD><TimeInput value={finalMix.timeA} onChange={(v)=>handleFinalMixChange("timeA",v)} /></TD>
                  <TD><RemarksInput value={finalMix.remarksA} onChange={(v)=>handleFinalMixChange("remarksA",v)} /></TD>
                </TableRow>
                <TableRow sx={{ background:rowBg(1), "&:hover":{background:"rgba(21,101,192,0.025)"}, "& td":{borderBottom:"none"} }}>
                  <TD><Stack direction="row" alignItems="center" gap={0.9}><SubBadge label="b"/><Typography sx={paramTextSx}>Vacuum</Typography></Stack></TD>
                  <TD><TimeInput value={finalMix.timeB} onChange={(v)=>handleFinalMixChange("timeB",v)} /></TD>
                  <TD><RemarksInput value={finalMix.remarksB} onChange={(v)=>handleFinalMixChange("remarksB",v)} /></TD>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </SectionCard>

      </Stack>
    </Box>
  );
};

export default LinearPreparation;
