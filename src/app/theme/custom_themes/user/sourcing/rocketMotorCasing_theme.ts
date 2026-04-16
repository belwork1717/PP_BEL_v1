import { alpha } from "@mui/material";

export const getRocketMotorCasingTheme = (baseTheme: any) => {
	const palette = baseTheme?.palette ?? {};

	return {
		header: {
			warningChip: {
				background: alpha(palette.warn ?? "#D4AC0D", 0.14),
				color: palette.warn ?? "#D4AC0D",
			},
		},
		form: {
			readinessHintColor: palette.success ?? "#148F77",
		},
		casingForm: {
			root: { fontFamily: "'DM Sans', sans-serif" },
			editModeIcon: { fontSize: 18, flexShrink: 0 },
			editModeBanner: {
				mb: 2.5,
				px: 2,
				py: 1.5,
				borderRadius: 2,
				background: alpha(palette.danger ?? "#C0392B", 0.05),
				border: `1.5px solid ${alpha(palette.danger ?? "#C0392B", 0.2)}`,
				display: "flex",
				alignItems: "center",
				gap: 1.2,
			},
			editModeBannerText: {
				fontSize: "0.75rem",
				color: palette.danger ?? "#C0392B",
				fontWeight: 600,
				lineHeight: 1.5,
			},
			headerIconBox: {
				width: 30,
				height: 30,
				borderRadius: "8px",
				background: `linear-gradient(135deg, ${palette.primary ?? "#1B4F72"}, ${palette.primaryLight ?? "#2E86C1"})`,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				boxShadow: `0 3px 8px ${alpha(palette.primary ?? "#1B4F72", 0.28)}`,
			},
			headerLaunchIcon: { color: "#fff", fontSize: 16 },
			headerTitle: {
				fontWeight: 700,
				fontSize: "0.9rem",
				color: palette.text,
			},
			headerSubtitle: {
				fontSize: "0.75rem",
				color: palette.textSub,
				mt: 0.3,
			},
			mandatoryChip: {
				height: 20,
				fontSize: "0.62rem",
				fontWeight: 700,
				background: alpha(palette.danger ?? "#C0392B", 0.08),
				color: palette.danger ?? "#C0392B",
				border: `1px solid ${alpha(palette.danger ?? "#C0392B", 0.2)}`,
				"& .MuiChip-icon": { ml: "5px" },
			},
			mandatoryChipIcon: { fontSize: "12px !important" },
			sectionChip: (color: string) => ({
				height: 17,
				fontSize: "0.58rem",
				fontWeight: 700,
				background: alpha(color || (palette.primaryLight ?? "#2E86C1"), 0.1),
				color: color || (palette.primaryLight ?? "#2E86C1"),
				border: `1px solid ${alpha(color || (palette.primaryLight ?? "#2E86C1"), 0.2)}`,
			}),
			subFieldContainer: {
				pl: 1.5,
				borderLeft: `2px solid ${alpha(palette.primaryLight ?? "#2E86C1", 0.25)}`,
				mb: 1.5,
			},
			subFieldArrow: { fontSize: 13, color: alpha(palette.primaryLight ?? "#2E86C1", 0.6) },
			subFieldLabel: { fontSize: "0.74rem", fontWeight: 700, color: palette.textSub },
			emptyStateIcon: { fontSize: 28, color: alpha(palette.primaryLight ?? "#2E86C1", 0.3), mb: 0.5 },
			emptyStateTitle: { fontSize: "0.78rem", color: palette.textSub, fontWeight: 600 },
			emptyStateSubtitle: { fontSize: "0.7rem", color: palette.textSub },
			dimTopMetaRow: { mb: 1.5, display: "flex", alignItems: "center", gap: 1.5 },
			tableContainer: {
				borderRadius: "8px",
				border: `1px solid ${palette.border}`,
				boxShadow: `0 1px 6px ${alpha(palette.primary ?? "#1B4F72", 0.05)}`,
			},
			tableHeaderLead: { minWidth: 200, width: "28%" },
			tableHeaderCell: (isRemarks = false) => ({
				minWidth: isRemarks ? 160 : 100,
				width: isRemarks ? "20%" : "13%",
				...(isRemarks ? { background: `linear-gradient(135deg, ${palette.accent ?? "#148F77"}, ${palette.accentLight ?? "#1ABC9C"})` } : {}),
			}),
			remarksHeaderBg: `linear-gradient(135deg, ${palette.accent ?? "#148F77"}, ${palette.accentLight ?? "#1ABC9C"})`,
			dataRow: (isEven: boolean) => ({
				background: isEven ? palette.surface : alpha(palette.surface ?? "#F4F6F8", 0.55),
				"&:hover": { background: alpha(palette.primaryLight ?? "#2E86C1", 0.04) },
				"&:last-child td": { borderBottom: "none" },
			}),
			paramIndexBadge: {
				width: 18,
				height: 18,
				borderRadius: "4px",
				flexShrink: 0,
				background: `linear-gradient(135deg, ${palette.primary ?? "#1B4F72"}, ${palette.primaryLight ?? "#2E86C1"})`,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			},
			paramIndexText: {
				fontSize: "0.55rem",
				fontWeight: 800,
				color: "#fff",
				lineHeight: 1,
			},
			paramNameText: {
				fontSize: "0.75rem",
				fontWeight: 600,
				color: palette.textSub,
				width: 130,
			},
			remarksCellField: {
				"& .MuiOutlinedInput-root": {
					alignItems: "flex-start",
				},
				"& .MuiInputBase-input": {
					fontWeight: 500,
					color: palette.text,
					padding: "5px 7px",
					fontSize: "0.75rem",
				},
			},
			dimInput: { "& .MuiInputBase-input": { textAlign: "center" } },
			sectionColors: {
				motorId: palette.primaryLight ?? "#2E86C1",
				clearance: palette.accent ?? "#148F77",
				insulation: "#7D3C98",
				waivers: palette.warn ?? "#D4AC0D",
				visual: palette.accentLight ?? "#1ABC9C",
				dimensional: "#1A5276",
			},
			footerNoteText: {
				fontSize: "0.7rem",
				color: palette.textSub,
				lineHeight: 1.5,
			},
			footerInfoIcon: { fontSize: 14, color: palette.primaryLight, flexShrink: 0 },
			sectionHeaderLabel: { fontSize: "0.82rem", fontWeight: 700, color: palette.text },
		},
	};
};

export default getRocketMotorCasingTheme;
