import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export const LandingNavbar = () => {
  return (
    <AppBar position="static" elevation={1}>
      <Container>
        <Toolbar sx={{ gap: 2 }}>
          <Box
            component="a"
            href="#home"
            sx={{ display: "flex", alignItems: "center", gap: 0.75, textDecoration: "none" }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 18, color: "#FFD700", opacity: 0.9 }} />
            <Typography
              variant="h6"
              sx={{ color: "common.white", fontWeight: 800, letterSpacing: "0.06em", fontFamily: "Georgia, serif" }}
            >
              Vedic Astro AI
            </Typography>
          </Box>
          {/* <Box sx={{ flexGrow: 1, display: "flex", gap: 1 }}>
            <Button color="inherit" href="#features">
              Features
            </Button>
            <Button color="inherit" href="#pricing">
              Pricing
            </Button>
          </Box> */}
          <Button color="inherit" href="/login" sx={{ marginLeft: "auto" }}>
            Login
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

