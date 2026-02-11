import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";

export const LandingNavbar = () => {
  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Container>
        <Toolbar sx={{ gap: 2 }}>
          <Typography
            component="a"
            href="#home"
            variant="h6"
            sx={{ color: "common.white", textDecoration: "none", fontWeight: 700 }}
          >
            Vedic Astro AI
          </Typography>
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

