import { createTheme } from "@mui/material/styles";

const glass = {
  backgroundImage: "none",
  backgroundColor: "rgba(255,255,255,.09)",
  border: "1px solid rgba(255,255,255,.22)",
  backdropFilter: "blur(22px) saturate(160%)",
  WebkitBackdropFilter: "blur(22px) saturate(160%)",
  boxShadow: "0 8px 32px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.18)",
};

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ffc940", contrastText: "#2a1c00" },
    secondary: { main: "#93a4ff" },
    error: { main: "#ff7a8a" },
    background: { default: "#0a0e2c", paper: "rgba(24,26,66,.78)" },
    text: { primary: "#f4f5ff", secondary: "rgba(244,245,255,.68)" },
  },
  shape: { borderRadius: 20 },
  typography: {
    fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSize: 15,
    button: { fontWeight: 700, letterSpacing: ".6px" },
  },
  components: {
    MuiCssBaseline: { styleOverrides: { body: { backgroundColor: "#0a0e2c" } } },
    MuiPaper: { styleOverrides: { root: glass } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 99, minHeight: 52, paddingInline: 22, fontSize: 15 },
        sizeSmall: { minHeight: 40, paddingInline: 16, fontSize: 13 },
        containedPrimary: {
          background: "linear-gradient(180deg,#ffd866,#ffc940)",
          boxShadow: "0 8px 24px rgba(255,201,64,.4), inset 0 1px 0 rgba(255,255,255,.6)",
          "&.Mui-disabled": { background: "rgba(255,201,64,.35)", color: "rgba(42,28,0,.6)", boxShadow: "none" },
        },
        outlined: { borderColor: "rgba(255,255,255,.22)", backgroundColor: "rgba(255,255,255,.16)", color: "#f4f5ff" },
        text: { textTransform: "none", letterSpacing: ".2px", fontWeight: 500, minHeight: 44 },
      },
    },
    MuiIconButton: { styleOverrides: { root: { width: 44, height: 44, backgroundColor: "rgba(255,255,255,.09)" } } },
    MuiChip: { styleOverrides: { root: { height: 36, borderRadius: 99, fontSize: 13, fontWeight: 500 } } },
    MuiDialog: {
      styleOverrides: {
        container: { alignItems: "flex-end", "@media (min-width:960px) and (min-height:540px)": { alignItems: "center" } },
        paper: { ...glass, backgroundColor: "rgba(24,26,66,.82)", borderRadius: 28, margin: 16, width: "100%", maxWidth: 488, maxHeight: "calc(100% - 32px)" },
      },
    },
    MuiBackdrop: { styleOverrides: { root: { backgroundColor: "rgba(4,5,18,.6)" } } },
    MuiBottomNavigation: { styleOverrides: { root: { ...glass, borderRadius: 20, height: 66, padding: 6 } } },
    MuiBottomNavigationAction: {
      styleOverrides: { root: { borderRadius: 16, color: "rgba(244,245,255,.68)", maxWidth: "none", "&.Mui-selected": { backgroundColor: "rgba(255,255,255,.16)", color: "#f4f5ff" } } },
    },
    MuiRating: { styleOverrides: { root: { color: "#ffc940", fontSize: "clamp(40px,13vw,54px)" }, iconEmpty: { color: "rgba(255,255,255,.2)" } } },
    MuiSnackbarContent: { styleOverrides: { root: { ...glass, backgroundColor: "rgba(24,26,66,.9)", color: "#f4f5ff", borderRadius: 99, justifyContent: "center", minWidth: 0 } } },
  },
});
