import { createTheme } from "@mui/material/styles";

const MAROON      = "#7C1F0A";
const SAFFRON     = "#C2410C";
const SAFFRON_LIGHT = "#EA580C";
const GOLD        = "#B45309";
const CREAM       = "#FEFCE8";

export const theme = createTheme({
  palette: {
    primary: {
      main: SAFFRON,
      light: SAFFRON_LIGHT,
      dark: MAROON,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: GOLD,
      light: "#D97706",
      dark: "#92400E",
      contrastText: "#FFFFFF",
    },
    background: {
      default: CREAM,
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1C0A02",
      secondary: "#78350F",
    },
    divider: "rgba(194, 65, 12, 0.15)",
    action: {
      selected: "rgba(194, 65, 12, 0.1)",
      hover: "rgba(194, 65, 12, 0.06)",
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${MAROON} 0%, ${SAFFRON} 100%)`,
          boxShadow: "0 2px 12px rgba(124, 31, 10, 0.45)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: `linear-gradient(135deg, ${MAROON} 0%, ${SAFFRON} 100%)`,
          "&:hover": {
            background: `linear-gradient(135deg, #4C1104 0%, ${MAROON} 100%)`,
            boxShadow: "0 4px 12px rgba(124, 31, 10, 0.4)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: "1px solid rgba(194, 65, 12, 0.12)",
          boxShadow: "0 2px 16px rgba(194, 65, 12, 0.07)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "&:hover fieldset": {
              borderColor: SAFFRON,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: "1px solid rgba(194, 65, 12, 0.12)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid rgba(194, 65, 12, 0.15)",
        },
      },
    },
  },
});
