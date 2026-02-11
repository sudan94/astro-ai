import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { LandingNavbar } from "../components/LandingNavbar";

export const LandingPage = () => {
  return (
    <>
      <LandingNavbar />

      <Box sx={{ backgroundColor: "grey.100", py: 7 }}>
        <Container maxWidth="lg">
          <Grid container justifyContent="center" textAlign="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h3" sx={{ mb: 2, fontWeight: 700 }}>
                An AI-Powered Way to Understand Vedic Astrology
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This project turns complex astrological data into a structured,
                human-readable format without superstition, noise, or confusion.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: 7 }} id="features">
        <Container maxWidth="lg">
          <Grid container justifyContent="center" sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                  What Is This?
                </Typography>
                <Typography color="text.secondary">
                  Not a prediction app. Not a horoscope feed.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, minmax(0, 1fr))",
              },
            }}
          >
            <Box sx={{ display: "flex" }}>
              <Card sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Structured Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Planetary positions, houses, nakshatras, and ascendant
                    presented as clean, explorable data not walls of text.
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ display: "flex" }}>
              <Card sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Vedic Focus
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Built specifically around Vedic astrology concepts such as
                    nakshatras, padas, and planetary motion.
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ display: "flex" }}>
              <Card sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Clarity First
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Designed for learners, developers, and curious minds who
                    want understanding, not blind belief.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* <Box sx={{ backgroundColor: "grey.100", py: 6 }} id="pricing">
        <Container maxWidth="lg">
          <Grid container justifyContent="center" sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                  Pricing
                </Typography>
                <Typography color="text.secondary">
                  Simple and transparent.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={3} justifyContent="center" alignItems="stretch">
            <Grid item xs={12} md={5} lg={4} sx={{ display: "flex" }}>
              <Card sx={{ flex: 1, textAlign: "center" }}>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    Free
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Access to chart structure, planetary data, and basic
                    visualizations.
                  </Typography>
                  <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 700 }}>
                    EUR 0
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={5} lg={4} sx={{ display: "flex" }}>
              <Card
                sx={{
                  flex: 1,
                  textAlign: "center",
                  borderColor: "primary.main",
                  borderWidth: 1,
                  borderStyle: "solid",
                }}
              >
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    Future Pro
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Deeper interpretations, saved charts, and advanced analysis.
                  </Typography>
                  <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 700 }}>
                    Coming later
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box> */}

      <Box sx={{ py: 6.2 }}>
        <Container maxWidth="lg">
          <Grid container justifyContent="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" textAlign="center" sx={{ mb: 2, fontWeight: 700 }}>
                About This Project
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                This is an independent project built with a focus on clarity,
                engineering quality, and respect for traditional systems.
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                The goal is not to replace astrologers but to provide a clean,
                modern interface for understanding complex astrological data.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ backgroundColor: "grey.600", color: "common.white", py: 3 }}>
        <Container maxWidth="lg">
          <Typography variant="caption" display="block" textAlign="center">
            (c) {new Date().getFullYear()} Sudan - Made with care - All rights reserved
          </Typography>
        </Container>
      </Box>
    </>
  );
};
