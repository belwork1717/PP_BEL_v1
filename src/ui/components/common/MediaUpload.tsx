import React, { useState, useRef } from "react";
import {
  Box, Stack, Typography, Chip, alpha, IconButton, LinearProgress, Tooltip,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

// ─── Palette ──────────────────────────────────────────────────────────────────
const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  accent: "#148F77",
  accentLight: "#1ABC9C",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
};

// ─── Media Utils (inline) ─────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_SIZE_MB = 50;

const validateMedia = (file) => {
  if (!file) return { valid: false, error: "No file selected" };
  const sizeInMB = file.size / (1024 * 1024);
  if (sizeInMB > MAX_SIZE_MB) return { valid: false, error: `File exceeds ${MAX_SIZE_MB}MB limit` };
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) return { valid: false, error: "Invalid format. Use JPG, PNG, WEBP, MP4, or WEBM." };
  return { valid: true, isImage, isVideo };
};

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeIn  = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;
const pulse   = keyframes`0%,100%{transform:scale(1)}50%{transform:scale(1.06)}`;

// ─── Styled ───────────────────────────────────────────────────────────────────
const DropZone = styled(Box)(({ isDragging, hasError, hasFile }) => ({
  position: "relative",
  borderRadius: 12,
  border: `2px dashed ${
    hasError ? BRAND.danger
    : hasFile ? BRAND.accent
    : isDragging ? BRAND.primaryLight
    : BRAND.border
  }`,
  background: isDragging
    ? alpha(BRAND.primaryLight, 0.05)
    : hasFile
    ? alpha(BRAND.accent, 0.03)
    : "#fff",
  transition: "all 0.25s ease",
  cursor: "pointer",
  overflow: "hidden",
  "&:hover": {
    borderColor: hasFile ? BRAND.accent : BRAND.primaryLight,
    background: hasFile ? alpha(BRAND.accent, 0.04) : alpha(BRAND.primaryLight, 0.04),
  },
}));

const HiddenInput = styled("input")({ display: "none" });

// ─── Preview Thumbnail ────────────────────────────────────────────────────────
const PreviewThumb = ({ file, previewUrl, onRemove }) => {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

  return (
    <Box
      sx={{
        display: "flex", alignItems: "center", gap: 1.5,
        p: "10px 14px",
        background: alpha(BRAND.accent, 0.05),
        borderRadius: "0 0 10px 10px",
        borderTop: `1px solid ${alpha(BRAND.accent, 0.15)}`,
        animation: `${fadeIn} 0.25s ease`,
      }}
    >
      {/* Thumbnail / icon */}
      <Box sx={{
        width: 44, height: 44, borderRadius: 2, overflow: "hidden", flexShrink: 0,
        border: `1px solid ${alpha(BRAND.accent, 0.2)}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: alpha(BRAND.accent, 0.08),
      }}>
        {isImage && previewUrl ? (
          <img src={previewUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <VideocamRoundedIcon sx={{ fontSize: 22, color: BRAND.accent }} />
        )}
      </Box>

      {/* File info */}
      <Box flex={1} minWidth={0}>
        <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: BRAND.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file.name}
        </Typography>
        <Stack direction="row" alignItems="center" gap={1} mt={0.3}>
          <Chip
            label={isImage ? "Image" : "Video"}
            size="small"
            icon={isImage
              ? <ImageRoundedIcon sx={{ fontSize: "11px !important", color: `${BRAND.accent} !important` }} />
              : <VideocamRoundedIcon sx={{ fontSize: "11px !important", color: `${BRAND.accent} !important` }} />
            }
            sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, background: alpha(BRAND.accent, 0.1), color: BRAND.accent, border: `1px solid ${alpha(BRAND.accent, 0.2)}` }}
          />
          <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub }}>{formatSize(file.size)}</Typography>
        </Stack>
      </Box>

      {/* Status + Remove */}
      <Stack direction="row" alignItems="center" gap={0.5}>
        <CheckCircleRoundedIcon sx={{ fontSize: 16, color: BRAND.accent }} />
        <Tooltip title="Remove file">
          <IconButton size="small" onClick={onRemove} sx={{ color: BRAND.danger, "&:hover": { background: alpha(BRAND.danger, 0.08) } }}>
            <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

// ─── MediaUpload Component ────────────────────────────────────────────────────
/**
 * MediaUpload
 *
 * Props:
 *   value       — current File | null
 *   onChange    — (file: File | null) => void
 *   label       — string, shown above dropzone
 *   description — optional helper text
 *   accept      — optional mime string (defaults to images + videos)
 */
const MediaUpload = ({
  value,
  onChange,
  label = "Visual Record",
  description = "Upload images or video of the visual observation",
  accept,
}) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  const acceptStr = accept || [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(",");

  const processFile = (file) => {
    const result = validateMedia(file);
    if (!result.valid) {
      setError(result.error);
      return;
    }
    setError("");
    if (result.isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    onChange(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = null; // reset so same file can be re-selected
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError("");
    onChange(null);
  };

  return (
    <Box>
      <DropZone
        isDragging={isDragging}
        hasError={!!error}
        hasFile={!!value}
        onClick={() => !value && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <HiddenInput ref={inputRef} type="file" accept={acceptStr} onChange={handleInputChange} />

        {/* Drop zone body */}
        {!value && (
          <Stack alignItems="center" gap={1} sx={{ py: 3.5, px: 2 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: "14px",
              background: isDragging
                ? `linear-gradient(135deg, ${BRAND.primaryLight}, ${BRAND.accentLight})`
                : alpha(BRAND.primaryLight, 0.1),
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.25s ease",
              animation: isDragging ? `${pulse} 0.8s ease infinite` : "none",
            }}>
              <CloudUploadRoundedIcon sx={{
                fontSize: 24,
                color: isDragging ? "#fff" : BRAND.primaryLight,
                transition: "color 0.2s",
              }} />
            </Box>

            <Box textAlign="center">
              <Typography sx={{ fontSize: "0.83rem", fontWeight: 700, color: BRAND.text }}>
                {isDragging ? "Drop to upload" : "Click or drag & drop"}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.3 }}>
                {description}
              </Typography>
            </Box>

            <Stack direction="row" gap={0.8} mt={0.5} flexWrap="wrap" justifyContent="center">
              {["JPG", "PNG", "WEBP", "MP4", "WEBM"].map((fmt) => (
                <Chip key={fmt} label={fmt} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, background: alpha(BRAND.border, 0.6), color: BRAND.textSub }} />
              ))}
              <Chip label={`≤ ${MAX_SIZE_MB}MB`} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, background: alpha(BRAND.warn, 0.1), color: "#7D6608" }} />
            </Stack>
          </Stack>
        )}

        {/* File selected — show preview strip */}
        {value && (
          <PreviewThumb file={value} previewUrl={previewUrl} onRemove={handleRemove} />
        )}
      </DropZone>

      {/* Error */}
      {error && (
        <Stack direction="row" alignItems="center" gap={0.8} mt={1}>
          <ErrorOutlineRoundedIcon sx={{ fontSize: 14, color: BRAND.danger }} />
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.danger, fontWeight: 600 }}>{error}</Typography>
        </Stack>
      )}
    </Box>
  );
};

export default MediaUpload;