import { alpha } from "@mui/material";

export const SOLID_PREP_BRAND = {
	primary: "#1B4F72",
	primaryLight: "#2E86C1",
	accent: "#148F77",
	warn: "#D4AC0D",
	danger: "#C0392B",
	surface: "#F4F6F8",
	border: "#D5D8DC",
	text: "#1C2833",
	textSub: "#5D6D7E",
	solid: "#1565C0",
	solidLight: "#1976D2",
} as const;

export const LIQUID_PREP_BRAND = {
	primary: "#1B4F72",
	primaryLight: "#2E86C1",
	accent: "#148F77",
	warn: "#D4AC0D",
	danger: "#C0392B",
	surface: "#F4F6F8",
	border: "#D5D8DC",
	text: "#1C2833",
	textSub: "#5D6D7E",
	liquid: "#1565C0",
	liquidLight: "#1976D2",
} as const;

export const LINEAR_PREP_BRAND = {
	primary: "#1B4F72",
	primaryLight: "#2E86C1",
	accent: "#148F77",
	warn: "#D4AC0D",
	danger: "#C0392B",
	surface: "#F4F6F8",
	border: "#D5D8DC",
	text: "#1C2833",
	textSub: "#5D6D7E",
	linear: "#1565C0",
	linearLight: "#1976D2",
} as const;

export const getRawMaterialPreparationTheme = (baseTheme: any) => {
	const palette = baseTheme?.palette ?? {};

	const materialColors = {
		solid: "#6D4C41",
		liquid: "#1565C0",
		linear: "#00695C",
	};

	return {
		colors: {
			material: materialColors,
		},
		page: {
			loadingSpinnerSize: 32,
		},
		header: {
			contentPadding: { p: "14px 18px" },
			typeChip: (color: string) => ({
				height: 20,
				fontSize: "0.65rem",
				fontWeight: 700,
				background: alpha(color, 0.1),
				color,
				border: `1px solid ${alpha(color, 0.28)}`,
				transition: "all 0.2s",
			}),
			footerContainer: (isEdit: boolean) => ({
				px: "18px",
				py: "11px",
				borderTop: `1px solid ${isEdit ? alpha(palette.danger, 0.14) : alpha(palette.primaryLight, 0.18)}`,
				background: isEdit ? alpha(palette.danger, 0.025) : alpha(palette.primary, 0.025),
			}),
			selectorGroup: { flexShrink: 0 },
			selectorLabel: (isEdit: boolean) => ({
				fontSize: "0.72rem",
				fontWeight: 700,
				letterSpacing: "0.03em",
				color: isEdit ? palette.danger : palette.primary,
			}),
			selectorHint: { fontSize: "0.68rem", color: palette.textSub },
			noTypeBox: {
				px: 1.3,
				py: 0.5,
				borderRadius: 2,
				background: alpha(palette.warn, 0.08),
				border: `1px dashed ${alpha(palette.warn, 0.4)}`,
			},
			noTypeIcon: { fontSize: 13, color: "#7D6608" },
			noTypeText: { fontSize: "0.68rem", fontWeight: 600, color: "#7D6608" },
			lockBox: {
				px: 1.3,
				py: 0.5,
				borderRadius: 2,
				background: alpha(palette.danger, 0.05),
				border: `1px dashed ${alpha(palette.danger, 0.25)}`,
			},
			lockIcon: { fontSize: 12, color: palette.danger },
			lockText: { fontSize: "0.68rem", color: palette.danger, fontWeight: 500, lineHeight: 1.4 },
			toggle: {
				container: (checked: boolean, locked: boolean, color: string) => ({
					display: "inline-flex",
					alignItems: "center",
					gap: 0.9,
					px: 1.5,
					py: 0.65,
					borderRadius: 2.5,
					border: checked ? `1.5px solid ${alpha(color, 0.5)}` : `1.5px dashed ${alpha(palette.border, 0.9)}`,
					background: checked ? alpha(color, 0.07) : alpha(palette.surface, 0.7),
					cursor: locked ? "not-allowed" : "pointer",
					userSelect: "none",
					transition: "all 0.18s ease",
					"&:hover": !locked
						? {
								background: alpha(color, 0.11),
								border: `1.5px solid ${alpha(color, 0.45)}`,
								transform: "translateY(-1px)",
								boxShadow: `0 3px 10px ${alpha(color, 0.18)}`,
							}
						: {},
				}),
				checkbox: (checked: boolean, color: string) => ({
					width: 15,
					height: 15,
					borderRadius: 0.7,
					flexShrink: 0,
					border: checked ? `2px solid ${color}` : `2px solid ${alpha(palette.textSub, 0.35)}`,
					background: checked ? color : "transparent",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					transition: "all 0.14s",
					boxShadow: checked ? `0 1px 4px ${alpha(color, 0.3)}` : "none",
				}),
				checkMark: {
					width: 8,
					height: 8,
					backgroundImage:
						'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 10 8\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 4l3 3 5-6\' stroke=\'white\' stroke-width=\'1.8\' fill=\'none\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
					backgroundRepeat: "no-repeat",
					backgroundPosition: "center",
					backgroundSize: "contain",
					display: "block",
				},
				icon: (checked: boolean, color: string) => ({
					fontSize: 13,
					color: checked ? color : alpha(palette.textSub, 0.55),
					flexShrink: 0,
				}),
				label: (checked: boolean, color: string) => ({
					fontSize: "0.74rem",
					fontWeight: checked ? 700 : 500,
					color: checked ? color : palette.textSub,
					lineHeight: 1,
				}),
				lockIcon: (color: string) => ({ fontSize: 11, color: alpha(color, 0.55), ml: 0.2 }),
			},
		},
		list: {
			materialConfig: {
				solid: { label: "Solid", color: materialColors.solid },
				liquid: { label: "Liquid", color: materialColors.liquid },
				both: { label: "Both", color: "#4A235A" },
				"type not selected yet": { label: "Type not Selected yet", color: "#616A6B", italic: true },
			} as Record<string, { label: string; color: string; italic?: boolean }>,
			fallbackMaterialConfig: { label: "-", color: "#555" },
			materialIcon: (color: string) => ({ fontSize: "12px !important", color: `${color} !important` }),
			materialChip: (cfg: { color: string; italic?: boolean }, isUnselected: boolean) => ({
				height: 22,
				fontSize: "0.68rem",
				fontWeight: isUnselected ? 500 : 700,
				fontStyle: cfg.italic ? "italic" : "normal",
				background: `${cfg.color}14`,
				color: cfg.color,
				border: `1px solid ${cfg.color}33`,
				maxWidth: 160,
			}),
			materialChipLabel: (isUnselected: boolean) => ({ px: isUnselected ? 0.8 : 1 }),
			priorityChip: (cfg: { bg: string; color: string; border: string }) => ({
				height: 22,
				fontSize: "0.68rem",
				fontWeight: 700,
				background: cfg.bg,
				color: cfg.color,
				border: `1px solid ${cfg.border}`,
			}),
		},
		builder: {
			sectionContainer: {
				...baseTheme.workflow.animatedContainer,
				paddingBottom: 2,
			},
			emptyStateBox: {
				mt: 1,
				py: 6,
				borderRadius: 3,
				textAlign: "center",
				border: `1.5px dashed ${alpha(palette.border, 0.8)}`,
				background: alpha(palette.surface, 0.5),
				...baseTheme.workflow.animatedContainer,
			},
			emptyStateIcon: { fontSize: 34, color: alpha(palette.textSub, 0.35), mb: 1.2 },
			emptyStateTitle: { fontWeight: 700, color: palette.textSub, fontSize: "0.9rem" },
			emptyStateSubtitle: { fontSize: "0.75rem", color: alpha(palette.textSub, 0.65), mt: 0.5 },
		},
		solidPreparation: {
			brand: {
				primary: palette.primary ?? SOLID_PREP_BRAND.primary,
				primaryLight: palette.primaryLight ?? SOLID_PREP_BRAND.primaryLight,
				accent: palette.accent ?? SOLID_PREP_BRAND.accent,
				warn: palette.warn ?? SOLID_PREP_BRAND.warn,
				danger: palette.danger ?? SOLID_PREP_BRAND.danger,
				surface: palette.surface ?? SOLID_PREP_BRAND.surface,
				border: palette.border ?? SOLID_PREP_BRAND.border,
				text: palette.text ?? SOLID_PREP_BRAND.text,
				textSub: palette.textSub ?? SOLID_PREP_BRAND.textSub,
				solid: "#1565C0",
				solidLight: "#1976D2",
			},
		},
	};
};

export default getRawMaterialPreparationTheme;
